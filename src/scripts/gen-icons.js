import sharp from 'sharp'

const bg = { r: 232, g: 235, b: 245, alpha: 1 } // cor #E8EBF5 do app

await sharp('src/assets/ICONE.png')
  .resize(380, 380, { fit: 'contain', background: bg })
  .flatten({ background: bg })
  .toFile('public/icon-192.png')

await sharp('src/assets/ICONE.png')
  .resize(900, 900, { fit: 'contain', background: bg })
  .flatten({ background: bg })
  .toFile('public/icon-512.png')

console.log('Ícones gerados!')