import os
import random
import pretty_midi as pm
import _pickle as pickle

import configuration as config


def getInstruments():
    instrument_names = ['Electric Guitar (jazz)', 'Acoustic Grand Piano',
                        'Bright Acoustic Piano', 'Electric Piano 1', 'Electric Piano 2', 'Drawbar Organ',
                        'Rock Organ', 'Church Organ', 'Reed Organ', 'Cello', 'Viola', 'Honky-tonk Piano', 'Glockenspiel',
                        'Percussive Organ', 'Accordion', 'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (clean)',
                        'Electric Guitar (muted)', 'Overdriven Guitar', 'Distortion Guitar', 'Tremolo Strings', 'Pizzicato Strings',
                        'Orchestral Harp', 'String Ensemble 1', 'String Ensemble 2', 'SynthStrings 1', 'SynthStrings 2']
    instruments = []
    for i in range(len(instrument_names)):
        instruments.append({"id": i, "name": instrument_names[i]})
    return instruments




def getSeedsRootPath():
    return "seeds/indroll/"



def getSeedGenres():

    genre_names = ["Blues", "Classical", "Rock", "Country", "Pop", "Jazz"]
    genre_folder = [
                    ["Blues_midkar_dot_com", ],
                    ["Classical_midkar_dot_com", ],
                    ["Classical_rock_ics_uci_edu_dot_com", "Rock Classics, Ben Burgraff"],
                    ["Country_classics_Ben_Burgraff_collection", ],
                    ["Pop_classics_Ben_Burgraff_collection"],
                    ["Jazz_midkar_dot_com"]]
    seed_genres = []
    for i in range(len(genre_names)):
        seed_genres.append({"id": i, "name": genre_names[i], "seed_folders": genre_folder[i]})
    return seed_genres



    
def getSeedGenreNames():
    seed_genres = getSeedGenres()
    genre_names = []
    for i in range(len(seed_genres)):
        genre_names.append({"id": seed_genres[i]["id"], "name": seed_genres[i]["name"]})
    return genre_names




def getRandomFileFromFolder(folderPath):
    while True:
        contents = os.listdir(folderPath)
        if (len(contents) == 0):
            return None
        selection = contents[random.randint(0, len(contents)-1)]
        folderPath = os.path.join(folderPath, selection)
        if (os.path.isfile(folderPath)):
            return folderPath



def getSeedFromGenre(genre_id):
    seed_genres = getSeedGenres()
    folders = seed_genres[genre_id]["seed_folders"]
    selected_folder = folders[random.randint(0, len(folders)-1)]
    return getRandomFileFromFolder(os.path.join(getSeedsRootPath(), selected_folder))


def getRandomSeed():
    return getRandomFileFromFolder(getSeedsRootPath())




# music is always generated in C major/A natural minor scale
# inorder to change the key the midi can be shifted
# note.pitch in prettry midi is a pitch, as a MIDI note number
# we can change that to shift the key
# so to go from C to D we should shift by +2
# because C C# D shows gap of 2 between them

def shift_midi(shift, midi_file, output_file):
    midi = pm.PrettyMIDI(midi_file)
    for instrument in midi.instruments:
        if not instrument.is_drum:
            for note in instrument.notes:
                note.pitch += shift
    midi.write(output_file)



def getKeyNames():
    keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    return keys

# how much to shift for the key
# eg. getShiftForKey("C#")
def getShiftForKey(key):
    keys = getKeyNames()
    if not key in keys:
        return "<<unknown>>"
    return keys.index(key)


# how much to shift for the key but on the lower octave
def getShiftForKeyLower(key):
    keys = getKeyNames()
    if not key in keys:
        return "<<unknown>>"
    return keys.index(key) - 12


def getShiftForKeyInLowerOctave(key, lower_by):
    shift = getShiftForKeyLower(key)
    if shift == "<<unknown>>":
        return shift
    return shift - 12 * (lower_by - 1)

def getShiftForKeyInHigherOctave(key, higher_by):
    shift = getShiftForKey(key)
    if shift == "<<unknown>>":
        return shift
    return shift + 12 * higher_by



# get the chord dictionary
def get_chord_dict():
    
    chord_to_index = pickle.load(open(os.path.join(config.dict_path, config.chord_dict_name), 'rb'))
    index_to_chord = pickle.load(open(os.path.join(config.dict_path, config.index_dict_name), 'rb'))
    return chord_to_index, index_to_chord



# convert the generated piano roll into the continuous midi that can be listened
def pianoroll_to_midi_continous(pianoroll, midi_folder, filename, instrument_name, bpm):
    if not os.path.exists(midi_folder):
        os.makedirs(midi_folder)
    midi = pm.PrettyMIDI(initial_tempo=bpm, resolution=200)    
    midi.time_signature_changes.append(pm.TimeSignature(4, 4, 0))
    piano_program = pm.instrument_name_to_program(instrument_name)
    piano = pm.Instrument(program=piano_program)
        
    tracker = []
    start_times  = dict()
    for i, note_vector in enumerate(pianoroll):
        notes = list(note_vector.nonzero()[0])
#        print('notes',notes)
        removal_list = []
        for note in tracker:
            if note in notes and (i)%8 is not 0:
#                print('removing', note, 'from notes')
                notes.remove(note)
            else:
                midi_note = pm.Note(velocity=80, pitch=note, start=(60/(2*bpm))*start_times[note], end=(60/(2*bpm))*i)
                piano.notes.append(midi_note)
#                print('removing', note, 'from tracker')
                removal_list.append(note)
        for note in removal_list:
            tracker.remove(note)
#        print('tracker',tracker)
#        print('notes',notes)

        for note in notes:
            tracker.append(note)
            start_times[note]=i
#        print('tracker',tracker)
#        print('-'*50)
    midi.instruments.append(piano)
#    print(midi.get_tempo_changes())
    midi.write(os.path.join(midi_folder,filename)+'.mid')