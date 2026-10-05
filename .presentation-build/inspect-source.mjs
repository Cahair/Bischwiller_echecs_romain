import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const root = String.raw`D:\Romain\Business\Sites\Bischwiller_echecs_romain\.presentation-build`;
const pres = await PresentationFile.importPptx(await FileBlob.load(String.raw`D:\Downloads\Comment publier des articles sur le site (1).pptx`));
await fs.mkdir(path.join(root,'source-render'), {recursive:true});
console.log((await pres.inspect({kind:'slide,textbox,shape,image,layout',maxChars:12000})).ndjson);
for (let i=0;i<pres.slides.items.length;i++) {
 const slide=pres.slides.items[i];
 const blob=await pres.export({slide,format:'png',scale:1.3});
 await fs.writeFile(path.join(root,'source-render',`slide-${i+1}.png`),new Uint8Array(await blob.arrayBuffer()));
 console.log('Rendered',i+1);
}
