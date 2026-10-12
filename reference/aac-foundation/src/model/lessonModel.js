export class LessonModel {
  #status='idle';#activity=null;#choice=null;
  get snapshot(){return {status:this.#status,activity:this.#activity,choice:this.#choice};}
  start(activity){if(!['story','play','routine'].includes(activity))throw new Error('Unknown activity');this.#activity=activity;this.#status='active';this.#choice=null;}
  choose(value){if(this.#status!=='active')throw new Error('Activity not active');if(typeof value!=='string'||!value.trim())throw new Error('Invalid choice');this.#choice=value;}
  pause(){if(this.#status==='active')this.#status='paused';}
  resume(){if(this.#status==='paused')this.#status='active';}
  finish(){this.#status='finished';}
}