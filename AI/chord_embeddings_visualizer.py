## VISUALIZE THE EMBEDDINGS OF ONLY THOSE CHORDS WHOSE NAME WE KNOW

import os
import numpy as np
import tensorflow as tf 
import keras
import _pickle as pickle

from tensorflow.contrib.tensorboard.plugins import projector 

# from data_processing import get_chord_dict
from configuration import chord_triad_tuple_to_chord_name


def get_chord_dict():
    chord_to_index = pickle.load(open("models/to_visualize/chord_dict.pickle", 'rb'))
    index_to_chord = pickle.load(open("models/to_visualize/index_dict.pickle", 'rb'))
    return chord_to_index, index_to_chord



LOG_DIR = "logs/chord_embeddings/unshifted_from_aayush"
metadata = os.path.join(LOG_DIR, 'metadata.tsv')


if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR) 



# extract embedding from chord model
# chord_model = "models/chords/1564233418-Shifted_False_Lr_1e-05_EmDim_10_opt_Adam_bi_False_lstmsize_512_trainsize_4_testsize_1_samples_per_bar8/model_Epoch100_4.pickle"
chord_model = "models/to_visualize/model_Epoch20_2200.pickle"
model = keras.models.load_model(chord_model)
embeddings = model.layers[0].get_weights()
embeddings = np.array(embeddings)
# embeddings shape: (1, 50, 10)
embeddings = embeddings.reshape(-1,embeddings.shape[2])

# find the chord embeddings with the name
chords_with_name = {}

index_to_chords = get_chord_dict()[1]

total_data_num = embeddings.shape[0]
print("----- total data num: {}".format(total_data_num))
for i in range(total_data_num):
    triad_tuple = index_to_chords[i]
    if triad_tuple in chord_triad_tuple_to_chord_name:
        chords_with_name[i] = chord_triad_tuple_to_chord_name[triad_tuple]


new_embeddings = []
for i in chords_with_name.keys():
    new_embeddings.append(embeddings[i])


# high_dimensional_vectors = np.random.rand(50, 10)
# tensors_to_visualize = tf.Variable(high_dimensional_vectors, name="high_dim_vectors")

tensors_to_visualize = tf.Variable(np.array(new_embeddings), name="chord_with_name_embeddings")


with open(metadata, "w") as metadata_file:
    for i in chords_with_name.keys():
        metadata_file.write("{}\n".format(chords_with_name[i]))



with tf.Session() as sess:
    saver = tf.train.Saver([tensors_to_visualize])

    # initialize the Variable in the session 
    sess.run(tensors_to_visualize.initializer)
    saver.save(sess, os.path.join(LOG_DIR, "hi_dim_vectors.ckpt"))

    # configurations to provide metadata/labels
    config = projector.ProjectorConfig()
    # one can add multiple embeddings
    embedding = config.embeddings.add()
    embedding.tensor_name = tensors_to_visualize.name 
    # link this tensor to its metadata file (e.g labels)
    embedding.metadata_path = metadata
    # save a config file that tensorboard will read during startup
    projector.visualize_embeddings(tf.summary.FileWriter(LOG_DIR), config)


## Quick Note:
## after running this code 
## adjust metadata path in projector_config.pbtxt file








# ## VISUALIZE HIGH DIMENSIONAL VECTORS WITH LABELS

# import os
# import numpy as np
# import tensorflow as tf 
# import keras
# from tensorflow.contrib.tensorboard.plugins import projector 

# from data_processing import get_chord_dict
# from settings import chord_triad_tuple_to_chord_name

# LOG_DIR = "logs/third"
# metadata = os.path.join(LOG_DIR, 'metadata.tsv')


# # extract embedding from chord model
# chord_model = "models/chords/1563977383-Shifted_True_Lr_1e-05_EmDim_10_opt_Adam_bi_False_lstmsize_512_trainsize_4_testsize_1_samples_per_bar8/model_Epoch20_4.pickle"
# model = keras.models.load_model(chord_model)
# embeddings = model.layers[0].get_weights()
# embeddings = np.array(embeddings)
# # embeddings shape: (1, 50, 10)
# embeddings = embeddings.reshape(-1,embeddings.shape[2])


# # high_dimensional_vectors = np.random.rand(50, 10)
# # tensors_to_visualize = tf.Variable(high_dimensional_vectors, name="high_dim_vectors")

# tensors_to_visualize = tf.Variable(embeddings, name="chord_embeddings")


# with open(metadata, "w") as metadata_file:

#     total_data_num = embeddings.shape[0]

#     # index_to_chords dict() returns the chord tuple
#     # from the given chord dictionary index
#     index_to_chords = get_chord_dict()[1]

#     for i in range(total_data_num):
#         # find chord name if we know 
#         triad_tuple = index_to_chords[i]
#         chord_name = "{}".format(i)
#         if i == 0:
#             chord_name = "<unknown>"
#         elif triad_tuple in chord_triad_tuple_to_chord_name:
#             chord_name = chord_triad_tuple_to_chord_name[triad_tuple]

#         metadata_file.write("{}\n".format(chord_name))

#     # classes = 10
#     # # total_data_num = high_dimensional_vectors.shape[0]
#     # total_data_num = embeddings.shape[0]
#     # # write header 
#     # metadata_file.write("id\tlabel\n")
#     # for i in range(total_data_num):
#     #     # assign random class to the data point [1 to 10]
#     #     metadata_file.write("%i\t%d\n" % (i,(int((np.random.rand())*10) + 1)))


# with tf.Session() as sess:
#     saver = tf.train.Saver([tensors_to_visualize])

#     # initialize the Variable in the session 
#     sess.run(tensors_to_visualize.initializer)
#     saver.save(sess, os.path.join(LOG_DIR, "hi_dim_vectors.ckpt"))

#     # configurations to provide metadata/labels
#     config = projector.ProjectorConfig()
#     # one can add multiple embeddings
#     embedding = config.embeddings.add()
#     embedding.tensor_name = tensors_to_visualize.name 
#     # link this tensor to its metadata file (e.g labels)
#     embedding.metadata_path = metadata
#     # save a config file that tensorboard will read during startup
#     projector.visualize_embeddings(tf.summary.FileWriter(LOG_DIR), config)


# ## Quick Note:
# ## after running this code 
# ## adjust metadata path in projector_config.pbtxt file
