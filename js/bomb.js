var cw, ch, cy, cx;
var isBombDefused = false;
var thisRGB;
var thisRGBRy;

const WireColor = {
  BLAU: 0,
  GELB: 1,
  LILA: 2
}

function initColorPicker() {
  // Hilfsfunktionen zur Farbumwandlung
  function rgb2hsl(rgb) {
    var r, g, b;
    if (rgb instanceof Array) {
      r = rgb[0] / 255;
      g = rgb[1] / 255;
      b = rgb[2] / 255;
    } else {
      r = arguments[0] / 255;
      g = arguments[1] / 255;
      b = arguments[2] / 255;
    }
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    var H = h * 360;
    var S = s * 100;
    var L = l * 100;
    return [H, S, L];
  }

  function hsl2rgb(HSL) {
    var h, s, l;
    if (HSL instanceof Array) {
      h = Number(HSL[0]) / 360;
      s = Number(HSL[1]) / 100;
      l = Number(HSL[2]) / 100;
    } else {
      h = Number(arguments[0]) / 360;
      s = Number(arguments[1]) / 100;
      l = Number(arguments[2]) / 100;
    }
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function rgb2hex(rgb) {
    var r, g, b;
    if (rgb instanceof Array) {
      r = Number(rgb[0]);
      g = Number(rgb[1]);
      b = Number(rgb[2]);
    } else {
      r = Number(arguments[0]);
      g = Number(arguments[1]);
      b = Number(arguments[2]);
    }
    var hexR = r.toString(16);
    if (hexR.length == 1) hexR = "0" + hexR;
    var hexG = g.toString(16);
    if (hexG.length == 1) hexG = "0" + hexG;
    var hexB = b.toString(16);
    if (hexB.length == 1) hexB = "0" + hexB;
    return [hexR, hexG, hexB];
  }

  function hex2rgb(hex) {
    var rgbRy = [];
    if (hex instanceof Array) {
      for (var i = 0; i < hex.length; i++) {
        rgbRy[i] = parseInt(hex[i], 16);
      }
    } else {
      for (var i = 0; i < arguments.length; i++) {
        rgbRy[i] = parseInt(arguments[i], 16);
      }
    }
    return rgbRy;
  }

  function hsl2hex(HSL) {
    var rgb = hsl2rgb(HSL);
    return rgb2hex(rgb);
  }

  function hex2hsl(HEX) {
    var rgb = hex2rgb(HEX);
    return rgb2hsl(rgb);
  }

  function hex2ry(hex) {
    if (hex.charAt(0) == "#") hex = hex.substr(1);
    var hexRy = ["ff", "ff", "ff"];
    if (hex.length == 6) {
      hexRy[0] = hex.slice(0, 2);
      hexRy[1] = hex.slice(2, 4);
      hexRy[2] = hex.slice(4, 6);
    } else if (hex.length == 3) {
      var r = hex.slice(0, 1);
      var g = hex.slice(1, 2);
      var b = hex.slice(2, 3);
      hexRy[0] = r + r;
      hexRy[1] = g + g;
      hexRy[2] = b + b;
    }
    return hexRy;
  }

  function rgb2ry(rgb) {
    var ry = rgb.split(/(\(|\))/)[2].split(",");
    for (var i = 0; i < ry.length; i++) {
      if (ry[i] < 0 || ry[i] > 255) return [255, 255, 255];
    }
    return ry;
  }

  function hsl2ry(hsl) {
    var hslry = [0, 0, 100];
    var ry = hsl.split(/(\(|\))/)[2].split(",");
    for (var i = 0; i < ry.length; i++) {
      hslry[i] = Number(ry[i].replace("%", ""));
      if (i > 0 && hslry[i] > 100) return [0, 0, 100];
    }
    return hslry;
  }

  function validateHex(hex) {
    return /(^#?[0-9A-F]{6}$)|(^#?[0-9A-F]{3}$)/i.test(hex);
  }

  function validateRgb(rgb) {
    return /^rgb\((\s*\d{1,3}\s*),(\s*\d{1,3}\s*),(\s*\d{1,3}\s*)\)$/.test(rgb);
  }

  function validateHsl(HSL) {
    return /^hsl\((\s*\d{1,3}\s*),(\s*\d{1,3}%\s*),(\s*\d{1,3}%\s*)\)$/.test(
      HSL
    );
  }

  function display_hex(ry) {
    var hex = "#" + ry[0] + ry[1] + ry[2];
    if (validateHex(hex)) {
      return hex;
    } else {
      return false;
    }
  }

  function display_rgb(ry) {
    var rgb =
      "rgb(" +
      Math.round(ry[0]) +
      "," +
      Math.round(ry[1]) +
      "," +
      Math.round(ry[2]) +
      ")";
    if (validateRgb(rgb)) {
      return rgb;
    } else {
      return false;
    }
  }

  function display_hsl(ry) {
    var hsl =
      "hsl(" +
      Math.round(ry[0]) +
      "," +
      Math.round(ry[1]) +
      "%," +
      Math.round(ry[2]) +
      "%)";
    if (validateHsl(hsl)) {
      return hsl;
    } else {
      return false;
    }
  }

  function getRelativeLuminance(rgb) {
    var rgb = rgb.map(function (c) {
      c /= 255;
      return c < 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return (21.26 * rgb[0] + 71.52 * rgb[1] + 7.22 * rgb[2]) / 100;
  }

  function colorContrast(c1, c2) {
    var l1 = getRelativeLuminance(c1);
    var l2 = getRelativeLuminance(c2);
    var ret = (l1 + 0.05) / (l2 + 0.05);
    return ret < 1 ? 1 / ret : ret;
  }

  function getFontColor(rgbRy) {
    if (colorContrast(rgbRy, [255, 255, 255]) >= 7) {
      return "white";
    } else {
      return "black";
    }
  }

  function initWireColorInfo(){
    wireColorInfo.style.backgroundColor = "rgb(255,255,255)";
    wireColorInfo.style.color = getFontColor([255, 255, 255]);
    wireColorInfo.innerHTML = "Schneide den <span class='font-bold'>richtigen</span> Draht durch!";
  }

  function blockInputAndRedirect() {
    // Alle anklickbaren Elemente deaktivieren
    var clickableElements = document.querySelectorAll('a, button, input, select, textarea');
    for (var i = 0; i < clickableElements.length; i++) {
        clickableElements[i].disabled = true;
    }

    // Benutzereingabe für 5 Sekunden blockieren
    setTimeout(function() {
        // Nach 5 Sekunden zur nächsten Seite weiterleiten
        window.location.href = 'story_end.html';
    }, 5000); // 5000 Millisekunden = 5 Sekunden
}

  // Palette- und Canvas-Initialisierung
  var palette = document.querySelector(".palette");
  var img = document.getElementById("img");
  var wireColorInfo = document.getElementById("wireColorInfo");
  initWireColorInfo();
  var colorsRy = [];
  var imgW = 800;
  var canvas = document.getElementById("canvas_bomb");
  var ctx = canvas.getContext("2d", { willReadFrequently: true });
  var pixels;

  img.onload = function () {
    cw = canvas.width = imgW;
    ch = canvas.height = Math.round((imgW * img.height) / img.width);
    cx = Math.round(cw / 2);
    cy = Math.round(ch / 2);

    // Zeichnen des Bildes auf dem Canvas
    ctx.drawImage(img, 0, 0, cw, ch);


    // Sicherstellen, dass cw und ch Ganzzahlen sind, bevor sie an getImageData übergeben werden
    var imgData = ctx.getImageData(0, 0, cw, ch);
    pixels = imgData.data;

    // Event Listener für mousemove
    canvas.addEventListener("mousemove", handleCanvasMouseMove, false);

    canvas.style.cursor = 'url(assets/images/mouseIcon/plier.cur), default';
  };

  function oMousePos(canvas, evt) {
    var ClientRect = canvas.getBoundingClientRect();
    return {
      x: Math.round(evt.clientX - ClientRect.left),
      y: Math.round(evt.clientY - ClientRect.top),
    };
  }
  function resetBomb() {
    loadImageAndRefreshCanvas("assets/images/bomb/bomb_uncut.png");
    wireColorInfo.removeEventListener("click", resetBomb);
    initWireColorInfo();
    // Event Listener erneut hinzufügen
    canvas.addEventListener("mousemove", handleCanvasMouseMove, false);
    canvas.addEventListener("click", canvasClick, false);
  }

  function canvasClick(event) {
    event.stopPropagation();
    event.preventDefault();
    var tolerance = 20;
    var matchingIndex = isWireColor(thisRGBRy, tolerance);
    var wrongWireText = "Falscher Draht <span class='font-bold'>+5</span> Minuten. <span class='font-bold'>Hier klicken</span>, um es nochmal zu versuchen";
    var correctWireText = "<span class='font-bold'>Bombe Entschärft<span>";
    switch (matchingIndex) {
      case WireColor.BLAU:
        loadImageAndRefreshCanvas("assets/images/bomb/bomb_cut_blau.png");
        canvas.removeEventListener("mousemove", handleCanvasMouseMove, false);
        wireColorInfo.innerHTML = wrongWireText;
        wireColorInfo.addEventListener("click", resetBomb);
        addTime(300);
        break;
      case WireColor.GELB:
        loadImageAndRefreshCanvas("assets/images/bomb/bomb_cut_gelb.png");
        canvas.removeEventListener("mousemove", handleCanvasMouseMove, false);
        wireColorInfo.innerHTML = wrongWireText;
        wireColorInfo.addEventListener("click", resetBomb);
        addTime(300);
        break;
      case WireColor.LILA:
        loadImageAndRefreshCanvas("assets/images/bomb/bomb_cut_lila.png");
        canvas.removeEventListener("mousemove", handleCanvasMouseMove, false);
        wireColorInfo.innerHTML = correctWireText;
        endGame();
        blockInputAndRedirect();
        break;
      default:
        return;
        break;
    }
    canvas.removeEventListener("click", canvasClick);
  }
  // Event Listener für click

  canvas.addEventListener("click", canvasClick, false);

  function isWireColor(rgbArray, tolerance) {
    var colorsToMatch = [
      [50, 158, 240], // #329ef0
      [255, 249, 117], // #fff975
      [161, 103, 229], // #a167e5
    ];

    var R = rgbArray[0];
    var G = rgbArray[1];
    var B = rgbArray[2];

    // Durchlaufen der Liste der spezifischen Farben
    for (var i = 0; i < colorsToMatch.length; i++) {
      var color = colorsToMatch[i];
      var targetR = color[0];
      var targetG = color[1];
      var targetB = color[2];

      // Überprüfen, ob die Farbe innerhalb der Toleranz liegt
      if (
        Math.abs(R - targetR) <= tolerance &&
        Math.abs(G - targetG) <= tolerance &&
        Math.abs(B - targetB) <= tolerance
      ) {
        return i; // Index der übereinstimmenden Farbe zurückgeben
      }
    }
    return -1; // Keine Übereinstimmung gefunden
  }

  // Definieren Sie die Event-Handler-Funktion
  function handleCanvasMouseMove(e) {
    var m = oMousePos(canvas, e);
    var i = (m.x + m.y * cw) * 4;
    var R = pixels[i];
    var G = pixels[i + 1];
    var B = pixels[i + 2];
    thisRGBRy = [R, G, B];
    thisRGB = display_rgb(thisRGBRy);

    var tolerance = 20;
    var matchingIndex = isWireColor(thisRGBRy, tolerance);
    switch(matchingIndex){
      case WireColor.BLAU:
        wireColorInfo.textContent = "Blauen Draht durchschneiden?";
        break;
      case WireColor.GELB:
         wireColorInfo.textContent = "Gelben Draht durchschneiden?";
        break;
      case WireColor.LILA:
         wireColorInfo.textContent = "Lila Draht durchschneiden?";
        break;
      default:
        initWireColorInfo();
        break
    }
    if (matchingIndex !== -1) {
      wireColorInfo.style.backgroundColor = thisRGB;
      wireColorInfo.style.color = getFontColor(thisRGBRy);
    } else {
      wireColorInfo.style.backgroundColor = "rgb(255,255,255)";
      wireColorInfo.style.color = getFontColor([255, 255, 255]);
    }
  }

  // Funktion zum Laden eines Bildes und Aktualisieren des Canvas
  function loadImageAndRefreshCanvas(imagePath) {
    var img = new Image();
    img.src = imagePath;

    img.onload = function () {
      var w = imgW;
      var h = (imgW * img.height) / img.width;

      // clear canvas & swatches
      ctx.clearRect(0, 0, cw, ch);
      colorsRy.length = 0;

      // resize the canvas
      (ch = canvas.height = h), (cy = ch / 2);

      // draw new image
      ctx.drawImage(this, 0, 0, w, h);
      imgData = ctx.getImageData(0, 0, cw, ch);
      pixels = imgData.data;
    };
  }

  // Sicherstellen, dass das Bild geladen wird, wenn es nicht bereits geladen ist
  if (img.complete) {
    img.onload();
  } else {
    img.src = img.src; // Ladeereignis für zwischengespeicherte Bilder auslösen
  }
}
