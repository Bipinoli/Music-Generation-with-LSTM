# add the parent directory to the sys.path list so that
# the python will know where to import modules from

import sys
import os
# print(os.path.dirname(os.getcwd()))
# print(os.getcwd())
sys.path.insert(1, os.getcwd())

import configuration as config



print(config.ORIGINAL_DATASET)


# couting the total number of data points in original dataset
org_midi_num = 0
for root, dirs, files in os.walk(config.ORIGINAL_DATASET):
    for file in files:
        org_midi_num += 1


print("There are total {} data in {}".format(org_midi_num, config.ORIGINAL_DATASET))
# Ans: 1037


