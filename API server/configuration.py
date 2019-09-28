import os

# models to generate music
# chord_model = "models/chords/model_Epoch50_4.pickle"
# melody_model = "models/melody/modelEpoch60.pickle"
chord_model = os.path.join("models", "chords", "model_Epoch20_2200.pickle")
melody_model = os.path.join("models", "melody", "modelEpoch5.pickle")


# path to take the seeds from
seed_path = os.path.join("seeds", "indroll")
seed_chord_path = os.path.join("seeds","chord_index")


# folder to save the generated midi
# it should be automatically cleaned
midi_save_folder = "temp"

# generated music name
generated_music_name = "gen_music"
shifted_music_name = "gen_music_shifted"
generated_mp3_music_name = "gen_audio"

# sheet music temporary save location
sheet_music_save_location = os.path.join("sheet_music_generation", "temp")
sheet_music_name = "sheet.xml"

# shifting all the major scale keys to the key of C or not?
shifted = True


# Specifies the method how to add the chord information to the input vector
# 'embed' uses the chord embedding of the chord model
# 'onehot' encodes the chord as one hot vector
# 'int' just appends the chord id to the input vector
chord_embed_method = 'embed'



# Appends also the next cord to the feature vector:
next_chord_feature = True

high_crop = 84
low_crop = 24
num_notes = 128
new_num_notes = high_crop - low_crop
chord_embedding_dim = 10


# Some parameters to extract the pianorolls
# fs = 4 for 8th notes
fs = 4
samples_per_bar = fs*2
octave = 12
melody_fs = 4


# Adds the count of the beat as a feature to the input vector
counter_feature = True
counter_size = 0
if counter_feature:
    counter_size = 3


# chord dictionary
dict_path = 'seeds'
chord_dict_name = 'chord_dict_shifted.pickle'
index_dict_name = 'index_dict_shifted.pickle'
