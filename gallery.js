import {locales} from './locales.js?v=20261025-2';
const API = 'https://photo-gallery-api-marwanywr3-lab.barboodmarwan.workers.dev';
const STUDIO_URL = 'https://gallery.marwanbarbood.com/';
const $ = id => document.getElementById(id);
let photos = []; let next = 0; let active = null; let controller; let requestId = 0;
let cardBlobUrl = null; let cardFile = null;
const node = (tag, text) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; return el; };
const preference={read(key){try{return localStorage.getItem(key);}catch{return null;}},save(key,value){try{localStorage.setItem(key,value);}catch{}}};
let language=preference.read('marwan-language')||'ar';if(!locales[language])language='ar';let statusKey='loading';
const t=key=>locales[language].text[key]??locales.en.text[key]??key;
function renderStatus(){$('status').textContent=statusKey==='ready'?(photos.length?`${new Intl.NumberFormat(language).format(photos.length)} ${t(photos.length===1?'shotsOne':'shots')}`:t('empty')):t(statusKey);$('more').textContent=t(statusKey==='loadError'?'retry':'more');}
function applyLanguage(){document.documentElement.lang=language;document.documentElement.dir=locales[language].dir;document.title=`${t('studio')} | Photography`;document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));$('language').value=language;$('language').setAttribute('aria-label',t('language'));$('theme').setAttribute('aria-label',t('theme'));$('close').setAttribute('aria-label',t('close'));$('close-card').setAttribute('aria-label',t('close'));$('card-preview').alt=t('cardAlt');for(const [index,button] of [...$('grid').children].entries())button.setAttribute('aria-label',`${t('view')} — ${photos[index].title}`);renderStatus();if(active&&$('viewer').open)view(active);}
for(const [code,locale] of Object.entries(locales)){const option=node('option',locale.name);option.value=code;$('language').append(option);}
$('language').onchange=()=>{language=$('language').value;preference.save('marwan-language',language);applyLanguage();};
function applyTheme(value){document.documentElement.dataset.theme=value;$('theme').value=value;document.querySelector('meta[name="theme-color"]').content=value==='light'?'#f7f5ee':'#10110f';}
const savedTheme=preference.read('marwan-theme');applyTheme(['light','dark'].includes(savedTheme)?savedTheme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
$('theme').onchange=()=>{applyTheme($('theme').value);preference.save('marwan-theme',$('theme').value);};applyLanguage();
$('year').textContent = new Date().getFullYear();
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => { if (event.target.tagName === 'IMG') event.preventDefault(); });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') event.preventDefault(); });
async function load(reset = false) {
  if (reset) { controller?.abort(); next = 0; photos = []; $('grid').replaceChildren(); }
  if (next === null) return;
  const sequence = ++requestId; controller = new AbortController(); $('more').disabled = true; statusKey='loading';renderStatus();
  try {
    const url = new URL('/api/photos', API); url.searchParams.set('limit','24'); url.searchParams.set('offset',String(next));
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit' }); if (!response.ok) throw new Error('تعذر تحميل المعرض');
    const data = await response.json(); if (sequence !== requestId) return;
    for (const photo of data.photos) {
      photos.push(photo); const button = node('button'); button.className = 'photo'; button.setAttribute('aria-label', `${t('view')} — ${photo.title}`);
      const frame = node('div'); frame.className = 'photo-frame'; const image = node('img'); image.src = photo.image_url; image.alt = photo.title; image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      const label = node('div'); label.className = 'photo-label'; const caption=node('div');caption.append(node('span',photo.title));const details=[photo.location,photo.photo_year].filter(v=>v!==null&&v!==undefined&&v!=='').join(' · ');if(details)caption.append(node('small',details));label.append(caption,node('span','↗')); frame.append(image); button.append(frame,label); button.onclick = () => view(photo); $('grid').append(button);
    }
    next = data.next_offset; $('more').hidden = next === null;
    statusKey='ready';renderStatus();
  } catch (error) { if (error.name !== 'AbortError') { statusKey='loadError';renderStatus();$('more').hidden=false; } }
  finally { if (sequence === requestId) $('more').disabled = false; }
}
$('more').onclick = () => load();
async function view(photo) {
  active = photo; $('photo-title').textContent = photo.title; $('description').textContent = photo.description; $('share-status').textContent = '';
  $('full').src = photo.image_url; $('full').alt = photo.title; $('tags').replaceChildren();
  for(const tag of photo.ai_tags)$('tags').append(node('span',tag));
  $('photo-meta').textContent=[photo.location,photo.photo_year].filter(v=>v!==null&&v!==undefined&&v!=='').join(' · ');
  $('exif').replaceChildren();
  if (photo.show_exif) for (const [key,label] of [['camera_model',t('camera')],['focal_length',t('focal')],['aperture',t('aperture')],['iso','ISO'],['shutter_speed',t('shutter')]]) {
    if (!photo[key]) continue; const row = node('div'); row.append(node('dt',label),node('dd',photo[key])); $('exif').append(row);
  }
  $('exif').hidden = !$('exif').children.length; $('viewer').showModal();
}
$('close').onclick = () => $('viewer').close(); $('close-card').onclick = () => $('card-dialog').close();
for (const dialog of [$('viewer'),$('card-dialog')]) dialog.addEventListener('click',event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
function textLines(ctx,text,width,maxLines) {
  const words = text.split(/\s+/); const lines = []; let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); return lines.slice(0,maxLines);
}
$('share').onclick = async () => {
  if (!active) return; $('share').disabled = true; $('share-status').textContent = t('preparing');
  try {
    const response = await fetch(active.image_url, { credentials: 'omit' }); if (!response.ok) throw new Error(t('unavailable'));
    const imageBlob = await response.blob(); const bitmap = await createImageBitmap(imageBlob);
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101510'; ctx.fillRect(0,0,1080,1350);
    const scale = Math.min(984/bitmap.width,960/bitmap.height); const w = bitmap.width*scale; const h = bitmap.height*scale;
    ctx.drawImage(bitmap,(1080-w)/2,60+(960-h)/2,w,h); bitmap.close();
    const shade = ctx.createLinearGradient(0,740,0,1060); shade.addColorStop(0,'#10151000'); shade.addColorStop(1,'#101510'); ctx.fillStyle = shade; ctx.fillRect(0,740,1080,350);
    ctx.save(); ctx.translate(540,540); ctx.rotate(-Math.PI/9); ctx.globalAlpha = .16; ctx.fillStyle = '#ffffff'; ctx.font = '600 88px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('@f_ioc',0,0); ctx.restore();
    ctx.fillStyle = '#d3dda9'; ctx.direction=locales[language].dir;ctx.textAlign=language==='ar'?'right':'left';ctx.font='40px Segoe UI'; textLines(ctx,active.title,930,2).forEach((line,i) => ctx.fillText(line,language==='ar'?1008:72,1080+i*52));
    ctx.strokeStyle = '#73845d'; ctx.beginPath(); ctx.moveTo(72,1190); ctx.lineTo(1008,1190); ctx.stroke();
    ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.fillStyle = '#e0e7d5'; ctx.font = '28px Segoe UI'; ctx.fillText('THE STUDIO / @f_ioc',72,1242);
    ctx.font = '20px Segoe UI'; ctx.fillStyle = '#9da98e'; ctx.fillText(STUDIO_URL.replace('https://',''),72,1295);
    ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.font = '23px Segoe UI'; ctx.fillText(t('rights'),1008,1242);
    const blob = await new Promise((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error(t('cardError'))),'image/jpeg',.94));
    if (cardBlobUrl) URL.revokeObjectURL(cardBlobUrl); cardBlobUrl = URL.createObjectURL(blob); cardFile = new File([blob],'marwan-f_ioc.jpg',{type:'image/jpeg'});
    $('card-preview').src = cardBlobUrl; $('save-card').href = cardBlobUrl; $('native-share').hidden = !navigator.canShare?.({files:[cardFile]}); $('card-dialog').showModal(); $('share-status').textContent = '';
  } catch (error) { $('share-status').textContent = error.message || t('cardError'); }
  finally { $('share').disabled = false; }
};
$('native-share').onclick = async () => { try { await navigator.share({files:[cardFile],title:active?.title,text:`THE STUDIO / @f_ioc — ${STUDIO_URL}`}); } catch (error) { if (error.name !== 'AbortError') $('share-status').textContent = t('saveHint'); } };
load(true);
