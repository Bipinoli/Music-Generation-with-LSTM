import os 

for content in os.listdir(os.getcwd()):
    name, ext = os.path.splitext(content)
    if ext == ".mid":
        # print("timidity {} -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k {}.mp3".format(content, name))
        os.system("timidity {} -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k {}.mp3".format(content, name))