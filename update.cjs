const fs = require('fs');

// 1. Fix index.css
let indexCss = fs.readFileSync('src/index.css', 'utf8');
indexCss = indexCss.replace(/font-family:[\s\S]*?;/, "font-family: 'Shippori Mincho', serif;");
if (!indexCss.includes("button, input, textarea, select")) {
  indexCss += "\nbutton, input, textarea, select { font-family: inherit; }\n";
}
fs.writeFileSync('src/index.css', indexCss);

// 2. Fix App.css translateY
let appCss = fs.readFileSync('src/App.css', 'utf8');
appCss = appCss.replace('transform: translateY(-5%);', 'transform: translateY(-12%);');
fs.writeFileSync('src/App.css', appCss);

// 3. Fix App.jsx
let appJsx = fs.readFileSync('src/App.jsx', 'utf8');

// Replace createHomeCanvas
const homeCanvasOldStr = `async function createHomeCanvas({
    nickname,
    concept,
    baseImageUrl,
    lowerImageUrl,
    upperImageUrl,
    accessoryImageUrls,
  }) {
    const width = 1400
    const height = 1700
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
  
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  
    ctx.fillStyle = '#f7fbff'
    roundedRect(ctx, 60, 60, width - 120, height - 120, 42)
    ctx.fill()
  
    const avatarCanvas = await drawAvatarCanvas({
      baseImageUrl,
      lowerImageUrl,
      upperImageUrl,
      accessoryImageUrls,
      size: 860,
    })
    ctx.drawImage(avatarCanvas, 270, 110, 860, 860)
  
    ctx.fillStyle = '#ffffff'
    roundedRect(ctx, 450, 1010, 500, 90, 45)
    ctx.fill()
  
    ctx.fillStyle = '#d4b895'
    ctx.font = 'bold 42px "Shippori Mincho", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(nickname || DEFAULT_NICKNAME, 700, 1055)
  
    ctx.fillStyle = '#ffffff'
    roundedRect(ctx, 170, 1150, 1060, 360, 30)
    ctx.fill()
  
    ctx.fillStyle = '#f2ce9e'
    ctx.font = 'bold 34px "Shippori Mincho", serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    drawWrappedText(
      ctx,
      (concept && concept.trim()) || 'コンセプトはまだ未設定だよ',
      210,
      1195,
      980,
      54,
      5
    )
  
    return canvas`;
    
const homeCanvasNewStr = `async function createHomeCanvas({
    nickname,
    concept,
    baseImageUrl,
    lowerImageUrl,
    upperImageUrl,
    accessoryImageUrls,
  }) {
    const width = 1400
    const height = 1700
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
  
    ctx.fillStyle = '#1a120e'
    ctx.fillRect(0, 0, width, height)
  
    ctx.fillStyle = '#291e19'
    ctx.strokeStyle = '#b88a5c'
    ctx.lineWidth = 10
    roundedRect(ctx, 60, 60, width - 120, height - 120, 42)
    ctx.fill()
    ctx.stroke()
  
    const avatarCanvas = await drawAvatarCanvas({
      baseImageUrl,
      lowerImageUrl,
      upperImageUrl,
      accessoryImageUrls,
      size: 860,
    })
    ctx.drawImage(avatarCanvas, 270, 110, 860, 860)
  
    ctx.fillStyle = '#3a2a22'
    ctx.strokeStyle = '#8c6a46'
    ctx.lineWidth = 4
    roundedRect(ctx, 450, 1010, 500, 90, 45)
    ctx.fill()
    ctx.stroke()
  
    ctx.fillStyle = '#d4b895'
    ctx.font = 'bold 42px "Shippori Mincho", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(nickname || DEFAULT_NICKNAME, 700, 1055)
  
    ctx.fillStyle = '#3a2a22'
    ctx.strokeStyle = '#8c6a46'
    ctx.lineWidth = 4
    roundedRect(ctx, 170, 1150, 1060, 360, 30)
    ctx.fill()
    ctx.stroke()
  
    ctx.fillStyle = '#f2ce9e'
    ctx.font = 'bold 34px "Shippori Mincho", serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    drawWrappedText(
      ctx,
      (concept && concept.trim()) || 'コンセプトはまだ未設定だよ',
      210,
      1195,
      980,
      54,
      5
    )
  
    return canvas`;

// Wait, let's just use regex replace to avoid newline issues:
appJsx = appJsx.replace(/ctx\.fillStyle = '#ffffff'[\s\S]*?ctx\.fillRect\(0, 0, width, height\)/g, "ctx.fillStyle = '#1a120e'\n    ctx.fillRect(0, 0, width, height)");
appJsx = appJsx.replace(/ctx\.fillStyle = '#f7fbff'[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#291e19'\n    ctx.strokeStyle = '#b88a5c'\n    ctx.lineWidth = 10\n    roundedRect(ctx, 60, 60, width - 120, height - 120, 42)\n    ctx.fill()\n    ctx.stroke()");
appJsx = appJsx.replace(/ctx\.fillStyle = '#ffffff'[\s\S]*?roundedRect\(ctx, 450, 1010, 500, 90, 45\)[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#3a2a22'\n    ctx.strokeStyle = '#8c6a46'\n    ctx.lineWidth = 4\n    roundedRect(ctx, 450, 1010, 500, 90, 45)\n    ctx.fill()\n    ctx.stroke()");
appJsx = appJsx.replace(/ctx\.fillStyle = '#ffffff'[\s\S]*?roundedRect\(ctx, 170, 1150, 1060, 360, 30\)[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#3a2a22'\n    ctx.strokeStyle = '#8c6a46'\n    ctx.lineWidth = 4\n    roundedRect(ctx, 170, 1150, 1060, 360, 30)\n    ctx.fill()\n    ctx.stroke()");

// QrCard replacements
appJsx = appJsx.replace(/ctx\.fillStyle = '#fbfdff'[\s\S]*?roundedRect\(ctx, 40, 40, width - 80, height - 80, 40\)[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#291e19'\n    ctx.strokeStyle = '#b88a5c'\n    ctx.lineWidth = 10\n    roundedRect(ctx, 40, 40, width - 80, height - 80, 40)\n    ctx.fill()\n    ctx.stroke()");
appJsx = appJsx.replace(/ctx\.fillStyle = '#8fbfff'[\s\S]*?roundedRect\(ctx, 90, 90, 190, 56, 28\)[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#594129'\n    ctx.strokeStyle = '#8c6a46'\n    ctx.lineWidth = 4\n    roundedRect(ctx, 90, 90, 190, 56, 28)\n    ctx.fill()\n    ctx.stroke()");
appJsx = appJsx.replace(/ctx\.fillStyle = '#ffffff'[\s\S]*?roundedRect\(ctx, 285, 1035, 290, 72, 36\)[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#3a2a22'\n    ctx.strokeStyle = '#8c6a46'\n    ctx.lineWidth = 4\n    roundedRect(ctx, 285, 1035, 290, 72, 36)\n    ctx.fill()\n    ctx.stroke()");
appJsx = appJsx.replace(/ctx\.fillStyle = '#ffffff'[\s\S]*?roundedRect\(ctx, 950, 400, 480, 480, 30\)[\s\S]*?ctx\.fill\(\)/, "ctx.fillStyle = '#ffffff'\n    ctx.strokeStyle = '#8c6a46'\n    ctx.lineWidth = 6\n    roundedRect(ctx, 950, 400, 480, 480, 30)\n    ctx.fill()\n    ctx.stroke()");

fs.writeFileSync('src/App.jsx', appJsx);
