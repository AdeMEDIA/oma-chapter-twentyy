#!/usr/bin/env node
// Independent editorial decisions for the complete film and the 60-second reel.
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const plain=(id,duration,extra={})=>({id,duration,...extra});
const hold=(id,duration,extra={})=>plain(id,duration,{motion:'push',...extra});
const connected=(id,duration,extra={})=>plain(id,duration,{fadeIn:0,fadeOut:0,...extra});
const full=[
 plain('opening-reveal',2,{fadeOut:0}),hold('opening',5,{fadeIn:0,fadeOut:.35}),
 plain('welcome-arrive',1.6,{fadeOut:0}),hold('welcome',4.6,{fadeIn:0,fadeOut:0}),connected('welcome-enter',.8),
 hold('room-cinema',6),connected('room-drift',2),hold('room-interface',4),hold('collection',3),
 hold('book-cover',3,{fadeOut:0}),connected('book-opening',1.25),
];
const leafDurations=[3,2.8,1.5,3,3,3,1.5,1.5,3.5,3.5];
for(let leaf=1;leaf<=10;leaf++){
 full.push(hold('book-leaf-'+leaf,leafDurations[leaf-1],{chapter:Math.ceil(leaf/2),fadeIn:0,fadeOut:leaf===10?.25:0,motion:undefined}));
 if(leaf<10)full.push(connected('book-turn-'+leaf,.8,{chapter:Math.ceil(leaf/2)}));
}
full.push(hold('letters-collection',3));
for(let letter=1;letter<=4;letter++){
 full.push(hold(`letter-${letter}-start`,3.3,{fadeOut:0,motion:undefined,letter}));
 full.push(connected(`letter-${letter}-scroll`,2.4,{letter}));
 full.push(hold(`letter-${letter}-end`,2.8,{fadeIn:0,motion:undefined,letter}));
}
full.push(
 hold('portrait',4),hold('portrait-laugh',4),hold('portrait-notes',5),
 plain('film-highlight',12,{label:'Oma, on Film — original uncropped highlight'}),
 hold('cake-lit',3,{fadeOut:0,motion:undefined}),connected('cake-flame',1.5),connected('cake-blow',3.2),hold('cake-celebration',3.3,{fadeIn:0}),
 hold('wishes-intro',3),hold('wishes-collection',4),hold('wish-letter',5),
 hold('little-notes',3),hold('little-note-open',4),
 plain('closing-reveal',2,{fadeOut:0}),hold('closing',9.25,{fadeIn:0,fadeOut:1.2}),
);
// Separate selections and timing: no speed-up of the long version.
const reel=[
 plain('opening-reveal',2,{fadeOut:0}),hold('opening',1,{fadeIn:0}),
 plain('welcome-arrive',1.6,{fadeOut:0}),hold('welcome',1.4,{fadeIn:0}),
 hold('room-cinema',4),hold('room-interface',2),
 hold('book-cover',1.2,{fadeOut:0}),connected('book-opening',1.25),
 hold('book-leaf-1',1.55,{fadeIn:0,fadeOut:0,motion:undefined}),connected('book-turn-1',.8),
 hold('book-leaf-2',1.2,{fadeIn:0,motion:undefined}),hold('book-leaf-4',1.7,{fadeOut:0,motion:undefined}),connected('book-turn-4',.8),
 hold('book-leaf-5',1.3,{fadeIn:0}),hold('book-leaf-6',1.5),hold('book-leaf-9',1.7),
 hold('letters-collection',1.5),hold('letter-1-start',2),plain('letter-3-scroll',2.4),hold('letter-4-end',1.1),
 hold('portrait',3),hold('portrait-laugh',2),plain('film-highlight',7,{start:1}),
 connected('cake-flame',1.5),connected('cake-blow',3.2),hold('cake-celebration',2.3,{fadeIn:0}),
 hold('wishes-collection',1.5),hold('little-note-open',1.5),
 plain('closing-reveal',2,{fadeOut:0}),hold('closing',4,{fadeIn:0,fadeOut:.8}),
];
// Guide major section cuts to the supplied track's measured pulse. Only held
// images change length; captured interaction clips keep their original speed.
const beatPeriod=.534045;
const sectionEnds=new Set(['opening','welcome','room-interface','book-leaf-9','letter-4-end','portrait-laugh','cake-celebration','little-note-open']);
let reelTime=0;
for(const segment of reel){
 if(sectionEnds.has(segment.id)){
   const target=Math.round((reelTime+segment.duration)/beatPeriod)*beatPeriod;
   segment.duration=Math.round((target-reelTime)*60)/60;
 }
 reelTime+=segment.duration;
}
// The final domain hold absorbs rounding so the export is precisely3600frames.
reel[reel.length-1].duration=Math.round((reel[reel.length-1].duration+60-reelTime)*60)/60;
const plan={
 full:{musicStart:0,musicVolume:.9,audioFadeIn:1,audioFadeOut:3,transitionDuration:.22,segments:full},
 reel:{musicStart:32.183,musicVolume:.9,audioFadeIn:.3,audioFadeOut:1.4,transitionDuration:.15,beatPeriod,beatAlignment:'Measured local audio pulse; major held-scene boundaries, original-speed interaction footage.',segments:reel},
};
for(const [name,timeline]of Object.entries(plan))console.log(name,timeline.segments.reduce((s,x)=>s+x.duration,0),timeline.segments.length+' segments');
const out=path.join(ROOT,'tools/showcase/edit-plan.json');fs.writeFileSync(out,JSON.stringify(plan,null,2)+'\n');
fs.mkdirSync(path.join(ROOT,'review-artifacts/showcase'),{recursive:true});
fs.copyFileSync(out,path.join(ROOT,'review-artifacts/showcase/edit-plan.json'));
