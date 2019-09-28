from keras.models import load_model
import tensorflow as tf
import numpy as np
import _pickle as pickle
import os

import chord_model
import configuration as config
import utility



'''
# changable parameters
parameters = {
    "genre_id": 2, # -optional
    "instrument_id": 3, # -optional
    "num_bars": 64, # number of bars of the generated music
    "BPM": 100, # pace of the music
    "chord_temperature": 1, # let it be in the range 0.1 to 2
    "seed_length": 4, # number of bars to seed with

    "note_cap" = 5, # how many notes can be played together at the same time
                    # it may not be accurate due to chords alongside melody
                    # it not provided default will be 4

    # following must come together
    "key": "C", # -optional # key of the generated music
    "octave_type": "lower", # -optional # (lower, higher) ?
    "which_octave": 2, # -optional # lower octave by 2
}
# keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
'''

# fixed parameters
# note_cap = 5
# note_cap = 1

with_seed = True



graph = tf.get_default_graph()

def generate(parameters):

    # clean the previously generated music first
    prev_musics = os.listdir(config.midi_save_folder)
    for music in prev_musics:
        os.unlink(os.path.join(config.midi_save_folder, music))

    with graph.as_default():
        generate_music(parameters)

    modify_generated_music(parameters)
    return get_music_to_return()
    # return os.listdir(config.midi_save_folder)


def get_music_to_return():
    contents = os.listdir(config.midi_save_folder)
    if (config.shifted_music_name + ".mid") in contents:
        return os.path.join(config.midi_save_folder, config.shifted_music_name + ".mid")
    else:
        return os.path.join(config.midi_save_folder, contents[0]) 





# generate music with the given parameters
def generate_music(parameters):

    chord_model_path = config.chord_model
    melody_model_path = config.melody_model


    # if provided select the seed from the given genre
    if "genre_id" in parameters:
        music_seed_path = utility.getSeedFromGenre(int(parameters["genre_id"]))
    else:
        music_seed_path = utility.getRandomSeed()
    seed_chords_path = music_seed_path.replace(config.seed_path, config.seed_chord_path, 1)

    print("seeding with -----")
    print(music_seed_path)
    print(seed_chords_path)
    print("------------------")

    midi_save_folder = config.midi_save_folder


    seed = pickle.load(open(music_seed_path, "rb"))[: 8 * parameters["seed_length"]]
    seed_chords = pickle.load(open(seed_chords_path, "rb"))[: parameters["seed_length"]]

    seed = ind_to_onehot(seed)[:, config.low_crop: config.high_crop]


    print("loading polyphonic model ... ")

    melody_model = load_model(melody_model_path)
    melody_model.reset_states()

    ch_model = chord_model.Chord_Model(
            chord_model_path,
            prediction_mode='sampling',
            first_chords=seed_chords,
            temperature= parameters["chord_temperature"])


    for i in range((parameters["num_bars"]+2)):
        ch_model.predict_next()


    if config.chord_embed_method == 'embed':
        embedded_chords = ch_model.embed_chords_song(ch_model.song)
    elif config.chord_embed_method == 'onehot':
        embedded_chords = data_class.make_one_hot_vector(ch_model.song, num_chords)
    elif config.chord_embed_method == 'int':
        embedded_chords = [[x] for x in ch_model.song]

    chords = []

    for j in range((len(ch_model.song)-2)*config.fs*2):
        ind = int(((j+1)/(config.fs*2)))
        if config.next_chord_feature:
            ind2 = int(((j+1)/(config.fs*2)))+1
            chords.append(list(embedded_chords[ind])+list(embedded_chords[ind2]))
        else:
            chords.append(embedded_chords[ind])

    chords=np.array(chords)

    if config.counter_feature:
        counter = [[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]]
        counter = np.array(counter*(len(ch_model.song)-2))
        chords = np.append(chords, counter, axis=1)


    seed = np.append(seed, chords[:seed.shape[0]], axis=1)    
    seed = np.reshape(seed, (seed.shape[0], 1, 1, seed.shape[1]))

    next_step = None 

    for step in seed:
        next_step = melody_model.predict(step)


    notes = sample_probability_vector(next_step[0])

    rest = []
    rest.append(notes)

    for chord in chords[seed.shape[0]:]:
        next_input = np.append(notes, chord, axis=0)
        next_input = np.reshape(next_input, (1, 1, next_input.shape[0]))
        next_step = melody_model.predict(next_input)
        if "note_cap" in parameters:
            notes = sample_probability_vector(next_step[0], parameters["note_cap"])
        else: 
            notes = sample_probability_vector(next_step[0])
        rest.append(notes)


    rest = np.array(rest)
    rest = np.pad(rest, ((0,0),(config.low_crop,config.num_notes-config.high_crop)), mode='constant', constant_values=0)
    ind = np.nonzero(rest)

    # instrument_name = 'Acoustic Guitar (steel)'
    instrument_names = utility.getInstruments()
    instrument_name = instrument_names[2]["name"]

    # if instrument has been provided via parameters use that
    if "instrument_id" in parameters:
        instrument_name = instrument_names[int(parameters["instrument_id"])]["name"]


    utility.pianoroll_to_midi_continous(rest, midi_save_folder, config.generated_music_name, instrument_name, parameters["BPM"])




# modify the generated midi according to the provided parameters
def modify_generated_music(parameters):

    shift = "<<unknown>>"

    # change key if given
    if "key" in parameters:
        if "which_octave" in parameters:
            if "octave_type" in parameters:
                if parameters["octave_type"] == "lower":
                    shift = utility.getShiftForKeyInLowerOctave(parameters["key"], int(parameters["which_octave"]))
                else:
                    shift = utility.getShiftForKeyInHigherOctave(parameters["key"], int(parameters["which_octave"]))
        else:
            shift = utility.getShiftForKey(parameters["key"])

    if "key" in parameters:
        print("to shift: {} to get key on {}".format(shift, parameters["key"]))
    if (shift != "<<unknown>>"):
        original = os.path.join(config.midi_save_folder, config.generated_music_name+".mid")
        shifted = os.path.join(config.midi_save_folder, config.shifted_music_name+".mid")
        utility.shift_midi(shift, original, shifted)







def sample_probability_vector(prob_vector, note_cap = 4):
    # Sample a probability vector, e.g. [0.1, 0.001, 0.5, 0.9]
    sum_probas = sum(prob_vector)
    
    if sum_probas > note_cap:
        prob_vector = (prob_vector/sum_probas)*note_cap
    
    note_vector = np.zeros((prob_vector.size), dtype=np.int8)
    for i, prob in enumerate(prob_vector):
        note_vector[i] = np.random.multinomial(1, [1 - prob, prob])[1]
    return note_vector


def ind_to_onehot(ind):
    onehot = np.zeros((len(ind), config.num_notes))
    for i, step in enumerate(ind):
        for note in step:
            onehot[i,note]=1
    return onehot