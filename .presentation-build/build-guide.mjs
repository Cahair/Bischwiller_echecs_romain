import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile, FileBlob } from '@oai/artifact-tool';
import sharp from 'sharp';

const workspaceDir = String.raw`D:\Romain\Business\Sites\Bischwiller_echecs_romain`;
const TMP = path.join(workspaceDir,'.presentation-build');
const SKILL_DIR = String.raw`C:\Users\romai\.codex\plugins\cache\openai-primary-runtime\presentations\26.909.12148\skills\presentations`;
const RUNTIME_PYTHON = String.raw`C:\Users\romai\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`;
process.env.RUNTIME_NODE_MODULES = String.raw`C:\Users\romai\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`;
const FINAL = path.join(workspaceDir,'livrables','Publier un article - Guide simple.pptx');
const {finalizePresentation} = await import(pathToFileURL(path.join(SKILL_DIR,'container_tools','artifact_tool_utils.mjs')).href);
const pres = Presentation.create({slideSize:{width:1280,height:720}});
const C = {ink:'#10151E', blue:'#4162BE', muted:'#506078', pale:'#DCE5FF', green:'#1C6B46', red:'#AB2537',white:'#FFFFFF'};
const media = {};
for(let i=1;i<=4;i++) media[i]=await fs.readFile(path.join(TMP,'media',`image${i}.png`));
const logo=await sharp(path.join(workspaceDir,'public','media','wordpress','2025','06','images.webp')).png().toBuffer();
const hero=await fs.readFile(path.join(workspaceDir,'public','videos','hero-chess-poster.jpg'));
const dims={1:[1902,952],2:[1908,958],3:[904,127],4:[1251,348]};

function text(slide,copy,x,y,w,h,size=28,bold=false,color=C.ink){
 const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 shape.text=copy;
 shape.text.style={typeface:'Arial',fontSize:size,bold,color,autoFit:'none',alignment:'left',verticalAlignment:'top',wrap:'square',insets:{left:0,right:0,top:0,bottom:0}};
 return shape;
}
function boldParts(shape,parts){for(const part of parts)shape.text.get(part).bold=true;return shape;}
function footer(s,n,dark=false){text(s,`${n} / 12`,1140,670,80,25,18,false,dark?C.pale:C.muted);}
function slide(title,n,notes=''){
 const s=pres.slides.add();s.background.fill=C.white;
 text(s,title,72,58,1136,70,44,true);footer(s,n);
 if(notes)s.speakerNotes.textFrame.setText(notes);
 return s;
}
function picture(s,idx,rect,x,y,w,alt){
 const [iw,ih]=dims[idx];const [l,t,r,b]=rect;
 const h=w*(b-t)/(r-l);
 const img=s.images.add({blob:media[idx],contentType:'image/png',alt,position:{left:x,top:y,width:w,height:h}});
 img.crop={left:l/iw,top:t/ih,right:1-r/iw,bottom:1-b/ih};
 return h;
}
function note(s,copy,y=605,color=C.muted){return text(s,copy,72,y,1128,55,24,false,color);}

// Cover. Photo and logo are original site assets.
{
 const s=pres.slides.add();s.background.fill='#101116';
 s.images.add({blob:hero,contentType:'image/jpeg',alt:'Illustration d’échecs utilisée sur le site du club',fit:'cover',position:{left:745,top:0,width:535,height:720},crop:{left:0.25,top:0,right:0.2,bottom:0}});
 s.images.add({blob:logo,contentType:'image/png',alt:'Logo du Cercle d’Échecs de Bischwiller',fit:'contain',position:{left:72,top:62,width:80,height:80}});
 text(s,'Cercle d’Échecs\nde Bischwiller',176,73,470,80,26,true,C.white);
 text(s,'Publier un article\nsur le site',72,247,665,185,66,true,C.white);
 text(s,'Le guide pas à pas',76,475,630,55,32,false,C.pale);
 text(s,'bischwiller-echecs.com',76,635,600,32,23,false,C.pale);
 s.speakerNotes.textFrame.setText('Illustration et logo : fichiers du site du Cercle d’Échecs de Bischwiller. Ce guide explique la publication depuis l’espace de rédaction.');
}
{
 const s=slide('1. Votre accès au site',2);
 text(s,'À faire une seule fois',72,149,1050,45,28,false,C.blue);
 text(s,'Demandez un lien d’invitation à Romain.',72,230,1080,55,31,true);
 text(s,'Ouvrez le lien et notez votre identifiant.',72,307,1080,55,31,true);
 boldParts(text(s,'Choisissez un mot de passe de 10 caractères minimum,\npuis retapez-le dans le deuxième champ.',72,384,1080,94,29),['10 caractères minimum']);
 boldParts(text(s,'Cliquez sur « Créer mon accès ».',72,504,1080,60,31),['Créer mon accès']);
 note(s,'Vous avez déjà un compte ? Passez directement à la page suivante.');
 s.speakerNotes.textFrame.setText('Romain prépare l’invitation et l’identifiant. L’utilisateur choisit uniquement son mot de passe. Après « Créer mon accès », le site ouvre l’espace de rédaction.');
}
{
 const s=slide('2. La connexion',3);
 text(s,'Ouvrez cette adresse dans votre navigateur :',72,171,1120,50,29);
 const link=text(s,'https://bischwiller-echecs.com/admin',72,245,1130,65,40,true,C.blue);
 link.text.get('https://bischwiller-echecs.com/admin').link={uri:'https://bischwiller-echecs.com/admin',isExternal:true};
 text(s,'Saisissez votre identifiant et votre mot de passe.',72,368,1100,60,31);
 boldParts(text(s,'Cliquez sur « Se connecter ».',72,455,1100,65,32),['Se connecter']);
 note(s,'Mot de passe oublié ? Demandez un nouveau lien à Romain.');
}
{
 const s=slide('3. Un nouvel article',4,'Capture d’écran : document fourni, diapositive 4. Le bouton se trouve en haut de l’accueil de l’espace de rédaction.');
 boldParts(text(s,'Sur l’accueil de l’espace admin, cliquez sur\n« Écrire un nouvel article ».',72,158,1136,95,30),['Écrire un nouvel article']);
 picture(s,1,[395,239,1510,403],72,305,1136,'Accueil de l’espace de rédaction avec le bouton Écrire un nouvel article');
 note(s,'Le formulaire de rédaction s’ouvre.',559);
}
{
 const s=slide('4. Le titre de l’article',5,'Capture d’écran : document fourni, diapositive 5. Le titre est obligatoire. Exemple de titre fictif, à remplacer par celui de votre article.');
 text(s,'Dans « Le titre », écrivez une phrase courte et précise.',72,167,1136,70,30);
 picture(s,2,[406,273,1282,459],72,272,1136,'Champ Le titre, obligatoire');
 text(s,'Exemple',72,551,250,40,24,true,C.blue);
 text(s,'Victoire de l’équipe 1 contre Metz',72,597,1136,50,31,true);
}
{
 const s=slide('5. La photo principale',6,'Capture d’écran : document fourni, diapositive 5. La photo principale est facultative et s’affiche aussi dans la liste des actualités.');
 text(s,'Facultatif : vous pouvez publier sans photo.',72,158,1136,55,28,false,C.blue);
 boldParts(text(s,'Cliquez sur « Choisir une photo ».\nSélectionnez une image sur votre ordinateur.\nAttendez qu’elle s’affiche.',72,266,472,185,28),['Choisir une photo']);
 text(s,'Cette photo apparaîtra\nen haut de l’article.',72,512,460,90,28);
 picture(s,2,[406,469,1282,812],590,255,618,'Zone La photo principale avec Choisir une photo');
}
{
 const s=slide('6. Le texte de l’article',7);
 boldParts(text(s,'Descendez jusqu’à « Le texte », puis écrivez votre article.',72,165,1136,85,31),['Le texte']);
 text(s,'Racontez ce qui s’est passé, où et quand.\nFaites des paragraphes courts.',72,283,1130,100,32);
 text(s,'La rubrique est facultative',72,451,1136,45,28,true,C.blue);
 text(s,'Dans « La rubrique », choisissez le thème qui convient.\nVous pouvez laisser ce choix vide.',72,509,1136,95,28);
 s.speakerNotes.textFrame.setText('Le titre et le texte sont les seuls champs obligatoires. Pour ajouter une photo dans le texte, cliquez à l’endroit souhaité puis sur « Ajouter des photos ». Pour joindre un document, utilisez « Joindre un PDF ». Ces options sont facultatives.');
}
{
 const s=slide('7. L’aperçu avant publication',8,'Capture d’écran : document fourni, diapositive 6. L’aperçu ne publie pas l’article. « Continuer à modifier » permet de revenir à la rédaction.');
 boldParts(text(s,'En bas de la page, cliquez sur « Aperçu ».',72,170,1136,75,31),['Aperçu']);
 picture(s,3,[29,29,181,96],72,290,320,'Bouton Aperçu');
 text(s,'Vérifiez le titre et le texte.\nRegardez aussi la photo, si vous en avez ajouté une.',460,279,735,145,29);
 boldParts(text(s,'Pour revenir au formulaire, cliquez sur « Continuer à modifier ».',72,514,1136,85,29),['Continuer à modifier']);
 note(s,'L’aperçu permet de vérifier le résultat avant de le rendre visible.',619);
}
{
 const s=slide('8. La publication',9,'Capture d’écran : document fourni, diapositive 6. Après la confirmation « C’est en ligne ! Votre article est visible sur le site. », le bouton « Voir l’article sur le site » ouvre la page publique.');
 boldParts(text(s,'Quand tout est prêt, cliquez sur « Publier l’article ».',72,167,1136,75,31),['Publier l’article']);
 picture(s,3,[662,27,877,98],72,285,425,'Bouton Publier l’article');
 text(s,'Attendez le message\n« C’est en ligne ! »',574,282,630,110,35,true,C.green);
 boldParts(text(s,'Cliquez ensuite sur « Voir l’article sur le site »\npour vérifier le résultat.',72,493,1136,105,30),['Voir l’article sur le site']);
 note(s,'Votre article est maintenant visible par les visiteurs.',618,C.green);
}
{
 const s=slide('Finir plus tard',10,'Capture d’écran : document fourni, diapositive 6. Un brouillon reste invisible sur le site. L’enregistrement n’est pas automatique.');
 boldParts(text(s,'Cliquez sur « Enregistrer sans publier ».',72,168,1136,75,31),['Enregistrer sans publier']);
 picture(s,3,[431,27,671,98],72,278,470,'Bouton Enregistrer sans publier');
 text(s,'Attendez le message\n« Brouillon enregistré. »',600,281,608,100,31,true);
 boldParts(text(s,'Sur l’accueil de l’espace admin, retrouvez votre article dans\n« Brouillons à terminer », puis cliquez sur « Reprendre ».',72,476,1136,106,29),['Brouillons à terminer','Reprendre']);
 note(s,'Un brouillon n’apparaît pas sur le site. Pensez à enregistrer avant de quitter.',615);
}
{
 const s=slide('Modifier un article publié',11,'Captures d’écran : document fourni, diapositives 4 et 7. Cliquez sur le titre de l’article dans la liste pour ouvrir la rédaction. Le lien « Voir » sert à consulter l’article.');
 text(s,'Sur l’accueil de l’espace admin, cliquez sur\nle titre de l’article à corriger.',72,154,1136,92,30);
 picture(s,1,[405,699,1505,807],72,260,1136,'Un article dans la liste de l’espace de rédaction');
 boldParts(text(s,'Faites vos corrections, puis cliquez sur\n« Enregistrer les modifications ».',72,436,630,115,29),['Enregistrer les modifications']);
 picture(s,4,[785,18,1094,88],773,442,435,'Bouton Enregistrer les modifications');
 note(s,'Vérifiez ensuite la page de l’article sur le site.',615);
}
{
 const s=slide('Retirer ou supprimer un article',12,'Capture d’écran : document fourni, diapositive 7. Ouvrez l’article concerné, puis descendez jusqu’à « Autres actions ». Une confirmation est demandée. La suppression retire définitivement l’article du site et de l’espace admin.');
 text(s,'Ouvrez l’article dans l’espace admin, puis descendez\njusqu’à « Autres actions ».',72,149,1136,87,29);
 picture(s,4,[18,128,894,316],72,250,1136,'Autres actions : Retirer du site (garder en brouillon) et Supprimer l’article');
 text(s,'Le garder pour plus tard',72,528,552,45,28,true,C.blue);
 text(s,'« Retirer du site (garder en brouillon) ».\nConfirmez : l’article reste dans l’espace admin.',72,582,551,80,24);
 text(s,'L’effacer définitivement',704,528,504,45,28,true,C.red);
 text(s,'« Supprimer l’article », puis confirmer.\nL’article disparaît aussi de l’espace admin.',704,582,504,74,24);
}

await fs.mkdir(path.join(TMP,'draft-render'),{recursive:true});
await (await PresentationFile.exportPptx(pres)).save(path.join(TMP,'candidate.pptx'));
await fs.writeFile(path.join(TMP,'authored-content.ndjson'),(await pres.inspect({kind:'slide,textbox',maxChars:100000})).ndjson);
for(let i=0;i<pres.slides.items.length;i++){
 const p=await pres.export({slide:pres.slides.items[i],format:'png',scale:1});
 await fs.writeFile(path.join(TMP,'draft-render',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await p.arrayBuffer()));
 console.log(`Rendered ${i+1}/12`);
}
if(process.argv.includes('--finalize')){
 const result=await finalizePresentation({workspaceDir,candidatePath:path.join(TMP,'candidate.pptx'),finalPath:FINAL,pythonExecutable:RUNTIME_PYTHON,integrityValidatorPath:path.join(SKILL_DIR,'container_tools','inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL_DIR,'container_tools','inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:path.join(TMP,'validation.json')});
 console.log(JSON.stringify(result));
 const final=await PresentationFile.importPptx(await FileBlob.load(FINAL));
 await fs.mkdir(path.join(TMP,'final-render'),{recursive:true});
 for(let i=0;i<final.slides.items.length;i++){
  const p=await final.export({slide:final.slides.items[i],format:'png',scale:1});
  await fs.writeFile(path.join(TMP,'final-render',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await p.arrayBuffer()));
 }
}
