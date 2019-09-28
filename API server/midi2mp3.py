import os 
import random
import music_generator as musicGen
import configuration as config




def make_mp3():
    # delete prexisting mp3
    mp3_path = os.path.join(config.midi_save_folder, config.generated_mp3_music_name)
    
    # it looks like the browser caches the files
    # and if the same filename is provided for the new file
    # the cached file can be return instead of the actual file from the server
    # this is my speculation and i am adding random string in each file
    # to solve this problem
    mp3_path += str(random.randint(0, 1000)) + ".mp3"

    # remove existing mp3 files
    for file in os.listdir(config.midi_save_folder):
        if file.endswith(".mp3"):
            os.unlink(os.path.join(config.midi_save_folder, file))

            
    os.system("timidity {} -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k {}".format(musicGen.get_music_to_return(), mp3_path))
    return mp3_path