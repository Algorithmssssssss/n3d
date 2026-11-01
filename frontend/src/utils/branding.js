// Browser-tab icon. It comes from the logo uploaded in Admin -> Settings.
// (The tab title is set per page by useDocumentTitle in siteText.js.)

const SIZE = 64;
const BRAND_COLOR = '#2c3e50'; // --primary-color

// Only the most recent update may apply: the logo image loads asynchronously.
let latestUpdate = 0;

const setIcon = (href) => {
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = href;
};

const newCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  return canvas;
};

// Favicons are square, logos usually aren't (the admin recommends 200x50). Fit the logo
// inside a transparent square instead of letting the browser stretch it.
const squareIcon = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = newCanvas();
        const scale = Math.min(SIZE / image.naturalWidth, SIZE / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        canvas.getContext('2d').drawImage(image, (SIZE - width) / 2, (SIZE - height) / 2, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error); // e.g. a cross-origin logo taints the canvas
      }
    };

    image.onerror = reject;
    image.src = src;
  });

// No logo yet: the company's first letter on the brand colour.
const letterIcon = (name) => {
  const canvas = newCanvas();
  const ctx = canvas.getContext('2d');
  const radius = 14;

  ctx.fillStyle = BRAND_COLOR;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(SIZE, 0, SIZE, SIZE, radius);
  ctx.arcTo(SIZE, SIZE, 0, SIZE, radius);
  ctx.arcTo(0, SIZE, 0, 0, radius);
  ctx.arcTo(0, 0, SIZE, 0, radius);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(SIZE * 0.6)}px Inter, "Noto Sans Khmer", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Array.from(name.trim())[0].toUpperCase(), SIZE / 2, SIZE / 2 + 2);

  return canvas.toDataURL('image/png');
};

// logoUrl: resolved URL of the uploaded logo, or ''. Does nothing until there is
// either a logo or a company name, so it never replaces the icon with a guess.
export const updateFavicon = async (logoUrl, companyName) => {
  const update = ++latestUpdate;

  if (logoUrl) {
    try {
      const icon = await squareIcon(logoUrl);
      if (update === latestUpdate) setIcon(icon);
    } catch (error) {
      // Couldn't redraw it: let the browser scale the file itself.
      if (update === latestUpdate) setIcon(logoUrl);
    }
  } else if (companyName && companyName.trim()) {
    setIcon(letterIcon(companyName));
  }
};
