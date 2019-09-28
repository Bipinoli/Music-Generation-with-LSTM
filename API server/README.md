# Guide to use

- [Setup](#setup)
- [Running the server](#running-the-server)
- [APIs available](#apis-available)
- [APIs details](#apis-details)
  * [To retrieve all the information relevant to generating the music](#to-retrieve-all-the-information-relevant-to-generating-the-music)
  * [To retrieve selected information](#to-retrieve-selected-information)
  * [To generate music](#to-generate-music)
    + [Compulsory Parameters](#compulsory-parameters)
    + [Optional Parameters](#optional-parameters)
  * [To modify the generated music](#to-modify-the-generated-music)
    + [Features](#features)
  * [To generate sheet music](#to-generate-sheet-music)
  * [To get music in mp3 format](#to-get-music-in-mp3-format)
- [Some tips incase of problems](#some-tips-incase-of-problems)

---

### Setup
- Install Python 3 and Pip
- Install the dependencies
```
   pip install tensorflow
   pip install Keras
   pip install numpy
   pip install pretty_midi
   pip install pickle5
   pip install Flask
```
```
   In order to be able to generate sheet music
   1. pip install music21 
   2. pip install matplotlib
   3. Install Musescore https://musescore.org/en/download
   4. Open sheet_music_generation/music21_musescore_work_together_configurer.py in text editor
   5. Change the path to the installed location of Musescore
   6. run: python sheet_music_generation/music21_musescore_work_together_configurer.py

You are all set !! 
```
  
---  
  
### Running the server
From the directory containing app.py in terminal, run: ` python app.py `<br>
Now the server should start and accept the requests at port 5000 <br>
In your case: ` localhost:5000 `

---

### APIs available

```
GET:   /api/v1/information/keyNames
GET:   /api/v1/information/instruments
GET:   /api/v1/information/genre
GET:   /api/v1/information/all
POST:  /api/v1/generate
POST:  /api/v1/modify
GET:   /api/v1/sheet_music/<name>
GET:   /api/v1/music_mp3
```

---

### APIs details

***

#### To retrieve all the information relevant to generating the music

` respone comes in application/json form `

```
GET:   /api/v1/information/all

eg:
localhost:5000/api/v1/information/all

returns

{
    "genre": [
        {
            "id": 0,
            "name": "Blues"
        },
        {
            "id": 1,
            "name": "Classical"
        },
       ...
    ],
    "instruments": [
        {
            "id": 0,
            "name": "Electric Guitar (jazz)"
        },
        {
            "id": 1,
            "name": "Acoustic Grand Piano"
        },
        ...
    ],
    "keys": [
        "C",
        "C#",
        ...
    ]
}
```

***

#### To retrieve selected information
```
GET:   /api/v1/information/keyNames
GET:   /api/v1/information/instruments
GET:   /api/v1/information/genre

eg:
  localhost:5000/api/v1/information/genre
  
  gives:

  [
      {
          "id": 0,
          "name": "Blues"
      },
      {
          "id": 1,
          "name": "Classical"
      },
      ...
  ]
```

***

#### To generate music
` POST:  /api/v1/generate `<br>
It requires:<br>
Request Header: ` Content-Type: application/json `<br>
Request Body in `application/json` form<br>
Response: `music in midi format` <br>
```
example request body:

{
  "genre_id": 2,
  "instrument_id": 3,
  "num_bars": 64,
  "BPM": 100,
  "chord_temperature": 1,
  "seed_length": 4,
  
  "note_cap": 2,

  "key": "C",
  "octave_type": "lower",
  "which_octave": 2
}
```

**genre_id** <br>
`id of the genre of the music to be produced` <br><br>
**instrument_id** <br>
`id of the instrument type to generate the music for` <br><br>
**num_bars** <br>
`how many bars of music to generate (length of the music)`<br><br>
**BPM** <br>
`speed of the generated music (beats per minute)`<br><br>
**chord_temperature** <br>
```
degree of randomness in the generated music
should be in the range [0.1 to 2]
```
**seed_length** <br>
```
number of bars to seed with while generating the music 
(how much of actual music to feed to generate new music)
```
**note_cap** <br>
```
number of notes that can be played together at the same time
it may not be exact because chord progression is not bound by it
but it effects the melody produced
its value should be in the range [1 to 5]
I suggest the front-end to have a slider rather than exact number as a input

If the produced music has too many notes at a same time
you can decrease this value
This attribute is optional
if not provided it takes the default value of 4
```

**key**<br>
`key of the generated music (eg. F#, G, A, ..)`<br><br>
**octave_type** <br>
```
can take values: "higher" or "lower"
it modifies the music to be in higher or lower octave
higher octave means of high pitch and lower means of lower pitch
```
**which_octave** <br>
```
this number specifies how many octaves higher or lower to go
if key is D#, octave_type is "higher" and which_octave is 2
then the music will shift towards higher frequency, 2 octave higher in the D# key 
if octave_type == "lower" then which_octave can be in the range [0 to 2]
if octave_type == "higher" then which_octave can be in the range [0 to 3]
```

##### Compulsory Parameters
```
"num_bars"
"BPM"
"chord_temperature"
"seed_length"
```

##### Optional Parameters
``` 
following parameters can come independently
"genre_id"
"instrument_id"
"note_cap"

following paramaters must come together
"key"
"octave_type"
"which_octave"
```

***

#### To modify the generated music

`POST:  /api/v1/modify` <br>

##### Features
- ability to change the key of the music
- ability to change the octave of the music 

It doesn't create a new music. It modifies the generated music according to the provided parameters.<br><br>
Request Header: `Content-Type: application/json` <br>
Request Body type: `application/json` <br>
Response: `music in midi format` <br>

Body must contain the fields ` "key", "octave_type", "which_octave" ` <br>

```
example: 
localhost:5000/api/v1/modify

body:
{
    "key": "F#", 
    "octave_type": "higher", 
    "which_octave": 3
}
```

---

#### To generate sheet music
`GET:   /api/v1/sheet_music/<name>`
where name = `pdf` or `png` <br>
Response: `sheet music as a file`

Sheet music is produced from the latest genereted or modified music. <br>
```
eg:
 localhost:5000/api/v1/sheet_music/pdf
 returns sheet music as a pdf file
 
 localhost:5000/api/v1/sheet_music/png
 returns sheet music as a png image

```

---

#### To get music in mp3 format
`GET:   /api/v1/music_mp3`
Response: `music file in mp3 format`

```
eg:
 localhost:5000/api/v1/music_mp3
 
 returns the music in mp3 format
```

---

### Some tips incase of problems
>Try disabling firewall if the api server is not accessible from other comupters
