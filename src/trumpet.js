


(async function() {
  const AUDIO_FILE = 'audio/trumpet.mp3';

  const context = new AudioContext();

  function splitNotes(buffer, noteLength, noteCount, offset = 0) {
    const result = [];
    const channels = buffer.numberOfChannels;
    const samplesPerNote = Math.round(noteLength * buffer.sampleRate);
    const offsetSamples = Math.round(offset * buffer.sampleRate);
    const tempBuf = new Float32Array(samplesPerNote);

    for (let i = 0; i < noteCount; i++) {
      result[i] = context.createBuffer(
        channels,
        buffer.numberOfChannels * samplesPerNote,
        buffer.sampleRate
      );
      for (let channel = 0; channel < channels; channel++) {
        buffer.copyFromChannel(
          tempBuf,
          channel,
          i * samplesPerNote + offsetSamples
        );
        result[i].copyToChannel(tempBuf, channel, 0);
      }
    }

    return result;
  }

  const response = await window.fetch(AUDIO_FILE);
  const arrayBuffer = await response.arrayBuffer();
  const trumpetBuffer = await context.decodeAudioData(arrayBuffer);
  const notes = splitNotes(trumpetBuffer, 4, 43, 0);

  let gainNode = null;
  let sourceNode = null;


  function play(audioBuffer) {
    sourceNode = context.createBufferSource();
    gainNode = context.createGain();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(gainNode);
    gainNode.connect(context.destination);
    sourceNode.start();
    return gainNode;
  }

  async function noteOff(decaySeconds=0.05) {
    if(gainNode) {
      gainNode.gain.exponentialRampToValueAtTime(
          0.00001,
          context.currentTime + decaySeconds
      );
    }
  }

  async function delay(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  async function playNote(note, seconds) {
    const octave = parseInt(note[note.length - 1]) + 1;
    const noteIdx = 'C,C#,D,D#,E,F,F#,G,G#,A,A#,B'
      .split(',')
      .indexOf(note.substr(0, note.length - 1));
    const idx = octave * 12 + noteIdx;
    const gainNode = play(notes[idx - 54]);
    await delay(seconds);

    gainNode.gain.exponentialRampToValueAtTime(
       0.00001,
       context.currentTime + 0.1
     );
  }

  async function melody() {
    while(true) {
      const whole = 1;
      await playNote('A#4', whole);
      await playNote('F5', whole);
      await playNote('D#5', whole / 8);
      await delay(whole / 16);
      await playNote('D5', whole / 8);
      await playNote('C5', whole / 8);
      await delay(whole / 16);
      await playNote('A#5', whole);
      await playNote('F5', whole / 2);
      await playNote('D#5', whole / 8);
      await delay(whole / 16);
      await playNote('D5', whole / 8);
      await playNote('C5', whole / 8);
      await delay(whole / 16);
      await playNote('A#5', whole);
      await playNote('F5', whole / 2);
      await playNote('D#5', whole / 8);
      await delay(whole / 16);
      await playNote('D5', whole / 8);
      await playNote('D#5', whole / 8);
      await playNote('C5', whole);
    }
  }

  //window.notes = notes;
  //window.play = play;

  const noteMap = {
    "1-DDD": "F#3",
    "1-DUD": "G3",
    "1-UDD": "G#3",
    "1-DDU": "A3",
    "1-DUU": "A#3",
    "1-UDU": "B3",
    "1-UUU": "C4",
    "2-DDD": "C#4",
    "2-DUD": "D4",
    "2-UDD": "D#4",
    "2-DDU": "E4",
    "2-DUU": "F4",
    "2-UDU": "F#4",
    "2-UUU": "G4",
    "3-UDD": "G#4",
    "3-DDU": "A4",
    "3-DUU": "A#4",
    "3-UDU": "B4",
    "3-UUU": "C5",
    "4-DDU": "C#5",
    "4-DUU": "D5",
    "4-UDU": "D#5",
    "4-UUU": "E5",
    "5-DUU": "F5",
    "5-UDU": "F#5",
    "5-UUU": "G5",
    "6-UDD": "G#5",
    "6-DDU": "A5",
    "6-DUU": "A#5",
    "6-UDU": "B5",
    "6-UUU": "C6"
  }

  // const playButton = document.querySelector('#playButton');
  // playButton.disabled = false;

  // playButton.onclick = melody;
  class TrumpetAudio {
    constructor() {
      this._blowing = false;
      this._valves = ['U','U','U'];
      this._partial = '1'
      this._noteMap = noteMap ;
    }

    valveDown(valveNumber) {
      let valveIndex = valveNumber-1;
      if(this._valves[valveIndex]==='U') {
        this.onValveChangedDown(valveIndex)
      }
    }

    valveUp(valveNumber) {
      let valveIndex = valveNumber-1;
      if(this._valves[valveIndex]==='D') {
        this.onValveChangedUp(valveIndex)
      }
    }

    get blowing() {
      return this._blowing ;
    }

    set blowing(blow) {
      if(blow && !this.blowing) {
        this.onStartBlowing()
      }
      if(!blow && this.blowing) {
        this.onEndBlowing()
      }
    }

    async onStartBlowing() {
      this._blowing = true;
      await playNote(this.note, 10)
    }

    async onEndBlowing() {
      this._blowing = false;
      await noteOff(0.75)
    }


    async onValveChangedDown(valveIndex) {
      this._valves[valveIndex]='D';
      if(this.blowing) {
        await noteOff()
        await playNote(this.note, 10)
      }
    }

    async playNote() {
      await playNote(this.note, 10)
    }

    async onValveChangedUp(valveIndex) {
      this._valves[valveIndex]='U';
      if(this.blowing) {
        await noteOff()
        await playNote(this.note, 10)
      }
    }

    get note() {
      return this._noteMap[this._partial+"-"+this._valves.join('')]
    }

    set partial(p) {
      if(this._partial !== p){
        this.onPartialChanged(p)
      }
    }

    async onPartialChanged(p) {
      this._partial = p;
      if(this.blowing) {
        noteOff()
        await playNote(this.note, 10)
      }
    }
  }

  let trumpetAudio = new TrumpetAudio();

  async function onKeyDown(e) {
    switch (e.key) {
      case 'j':
        document.querySelector(".valve.one").classList.add("pressed");
        trumpetAudio.valveDown(1);
        break;
      case 'k':
        document.querySelector(".valve.two").classList.add("pressed");
        trumpetAudio.valveDown(2);
        break;
      case 'l':
        document.querySelector(".valve.three").classList.add("pressed");
        trumpetAudio.valveDown(3);
        break;
      case ' ':
        trumpetAudio.blowing = true ;
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        trumpetAudio.partial = e.key;
        break
    }
  }

  async function onKeyUp(e) {
    switch (e.key) {
      case 'j':
        document.querySelector(".valve.one").classList.remove("pressed");
        trumpetAudio.valveUp(1);
        break;
      case 'k':
        document.querySelector(".valve.two").classList.remove("pressed");
        trumpetAudio.valveUp(2);
        break;
      case 'l':
        document.querySelector(".valve.three").classList.remove("pressed");
        trumpetAudio.valveUp(3);
        break;
      case ' ':
        trumpetAudio.blowing = false ;
        break;
    }
  }

  //Whenever the user presses a key down, run the proper function
  window.addEventListener("keydown", onKeyDown);

  //Whenever the user lets a key up, run the proper function
  window.addEventListener("keyup", onKeyUp);

})();
