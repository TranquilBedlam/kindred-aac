export class SpeechService{
  constructor(speakFn){if(typeof speakFn!=='function')throw new Error('Speech adapter required');this.speakFn=speakFn;}
  async speak(phrase){if(typeof phrase!=='string'||!phrase.trim())return false;await this.speakFn(phrase);return true;}
}