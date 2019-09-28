from music21 import *
from music21.converter.subConverters import ConverterMusicXML
import os
import random
import configuration as config


def generate_sheet_music(midi_file_path, filetype="pdf"):
    try:
        mf = midi.MidiFile()
        mf.open(str(midi_file_path))
        mf.read()
        mf.close()

        print("\n\n -- Midi successfully read --- \n\n")

        # get stream
        s = midi.translate.midiFileToStream(mf)

        print("\n\n -- Stream successfully created --- \n\n")

        # write sheet music as pdf/png
        conv_musicxml = ConverterMusicXML()

        emptyDirectory(config.sheet_music_save_location)
        scorename = os.path.join(config.sheet_music_save_location, config.sheet_music_name)
        
        print("\n\n -- Score name: {} --- \n\n".format(scorename))

        if filetype == "pdf":
            print("\n\n -- Filetype pdf --- \n\n")
            out_flepath = conv_musicxml.write(s, 'musicxml', fp=scorename, subformats=['pdf'])
        else:
            print("\n\n -- Filetype not pdf --- \n\n")
            out_flepath = conv_musicxml.write(s, 'musicxml', fp=scorename, subformats=['png'])
        
        return out_flepath

    except: 
        print("\n\n--- Something went wrong ---\n\n")
        return None



def emptyDirectory(dir):
    contents = os.listdir(dir)
    for c in contents:
        os.unlink(os.path.join(dir, c))