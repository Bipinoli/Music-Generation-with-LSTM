from music21 import environment


# place the path to the installed location of musescore
# if you are in windows it may be something like C:/MuseScore2/bin/MuseScore.exe"
# if you are on linux you might have to set permission to musescore

musescore_path = "/usr/bin/musescore"

environment.set("musescoreDirectPNGPath", musescore_path)
environment.set("musicxmlPath", musescore_path)