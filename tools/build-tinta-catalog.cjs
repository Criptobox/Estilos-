/* Inventario base reproducible, sin navegador y sin modificar IDs ni proyectos. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),web=path.join(root,'web');
const read=name=>fs.readFileSync(path.join(web,'js',name+'.js'),'utf8');
const context=vm.createContext({});
for(const name of ['util','icons','designs-core','designs-a','designs-b','designs-c','designs-d','data','designs-extra','tinta-states','tinta-catalog'])vm.runInContext(read(name),context,{filename:name+'.js'});
const crear=read('crear'),start=crear.indexOf('function icon('),end=crear.indexOf('\nCATALOG.forEach');
if(start<0||end<0)throw Error('No se encontró la colección base de Tinta.');
vm.runInContext(crear.slice(start,end)+'\nCATALOG.forEach(b=>b.source="new");\nthis.curated=CATALOG;',context);
vm.runInContext(`
(function(){const roles={Encabezados:'header',Tarjetas:'cards',Botones:'actions',Barras:'nav',Chat:'chat',Listas:'list',Avatares:'avatars',Plantillas:'templates',Formularios:'forms',Entradas:'inputs',Hojas:'sheets',Avisos:'notices',Datos:'data',Paletas:'palettes','Tipografía':'type',Animaciones:'motion',Fondos:'background',Widgets:'widgets',Iconos:'icons'};
const library=SEED.map(entry=>{let p;if(entry.code){const css=[...entry.code.matchAll(/<style[^>]*>([\\s\\S]*?)<\\/style>/gi)].map(m=>m[1]).join('\\n');p={html:entry.code.replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi,''),css};}else p=designParts(entry);return {id:'lib-'+entry.id,libraryId:entry.id,reference:entry.ref,name:entry.name,desc:entry.desc,role:roles[entry.tab],source:'library',variant:entry.code?'custom':variantOf(entry),properties:{colors:entry.colors,radius:entry.radius,mode:entry.mode},html:p.html,css:p.css};});
const records=TintaCatalog.build([...curated,...library]);TintaCatalog.validate(records);
this.inventory={schema_version:1,specification:'Biblioteca maestra UI/UX v1.0',scope:'Catálogo base: no incluye personalizaciones del navegador ni proyectos.',modules:TintaCatalog.modules,records};}).call(this);
`,context);
const out=path.join(root,'design-library');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(context.inventory,null,2)+'\n');
console.log(context.inventory.records.length+' registros, '+new Set(context.inventory.records.map(r=>r.family)).size+' familias, '+context.inventory.modules.length+' módulos definidos.');
