
function initColorPicker(){
    function rgb2hsl(rgb){
        // arguments: [r,g,b] or r,g,b
        // return [H, S, L];
        if (rgb instanceof Array) {
          r = rgb[0] / 255;
          g = rgb[1] / 255;
          b = rgb[2] / 255;
        } else {
          r = arguments[0] / 255;
          g = arguments[1] / 255;
          b = arguments[2] / 255;
        }
          //r /= 255, g /= 255, b /= 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b);
          var h, s, l = (max + min) / 2;
      
          if(max == min){
              h = s = 0; // achromatic
          }else{
              var d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch(max){
                  case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                  case g: h = (b - r) / d + 2; break;
                  case b: h = (r - g) / d + 4; break;
              }
              h /= 6;
          }
          var H = h*360;
          var S = s*100;
          var L = l*100;
          return [H, S, L];
      } // arguments: [r,g,b] or r,g,b
      
      function hsl2rgb(HSL){
         // arguments: [H,S,L] or H,S,L
        //return [r, g, b];
        if (HSL instanceof Array) {
          h = Number(HSL[0]) / 360;
          s = Number(HSL[1]) / 100;
          l = Number(HSL[2]) / 100;
        } else {
          h = Number(arguments[0]) / 360;
          s = Number(arguments[1]) / 100;
          l = Number(arguments[2]) / 100;
        }
         // var h = H/360;
         //var s = S/100;
         //var l = L/100;
          var r, g, b;
      
          if(s == 0){
              r = g = b = l; // achromatic
          }else{
              var hue2rgb = function hue2rgb(p, q, t){
                  if(t < 0) t += 1;
                  if(t > 1) t -= 1;
                  if(t < 1/6) return p + (q - p) * 6 * t;
                  if(t < 1/2) return q;
                  if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                  return p;
              }
      
              var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              var p = 2 * l - q;
              r = hue2rgb(p, q, h + 1/3);
              g = hue2rgb(p, q, h);
              b = hue2rgb(p, q, h - 1/3);
          }
      
          return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      } // arguments: [H,S,L] or H,S,L
      
      function rgb2hex(rgb) {
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
        if (hexR.length == 1) {
          hexR = "0" + hexR;
        };
        var hexG = g.toString(16);
        if (hexG.length == 1) {
          hexG = "0" + hexG;
        };
        var hexB = b.toString(16);
        if (hexB.length == 1) {
          hexB = "0" + hexB;
        };
        return [hexR, hexG, hexB];
      } // arguments: array [r,g,b] or 3 values: r,g,b
      
      function hex2rgb(hex) {
        // arguments: array [r,g,b] or 3 values: r,g,b
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
      
      } // arguments: array [r,g,b] or 3 values: r,g,b
      
      function hsl2hex(HSL){// arguments: [H,S,L]!!!
        var rgb = hsl2rgb(HSL); 
        return rgb2hex(rgb);
      }// arguments: [H,S,L]!!!
      
      function hex2hsl(HEX){// arguments: [R,G,B]!!!
        var rgb = hex2rgb(HEX);
        return rgb2hsl(rgb);
      }// arguments: [R,G,B]!!!
      
      function hex2ry(hex) {
      
        if (hex.charAt(0) == "#") {
          hex = hex.substr(1);
        }
      
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
      } // argument: "#123456" || "#123" || "123456" || "123"
      
      function rgb2ry(rgb) {
        // "rgb(255,100,178)"
        // "255,100,178"
        // ["255", "100", "178"]
        var ry = rgb.split(/(\(|\))/)[2].split(",");
        for(var i = 0; i < ry.length;i++){
          if(ry[i] < 0 || ry[i] > 255) return [255,255,255];
        }
        return ry;
      } // argument: "rgb(255,100,178)"
      
      function hsl2ry(hsl) {
        // "hsl(255,100%,50%)"
        // "255,100%,50%"
        // ["255", "100", "178"]
        var hslry = [0, 0, 100];
       
        var ry = hsl.split(/(\(|\))/)[2].split(",");
        for (var i = 0; i < ry.length; i++) {
          hslry[i] = Number(ry[i].replace("%", ""))//.trim();
          if(i > 0 && hslry[i] > 100) return [0, 0, 100];
        }
        return hslry;
      } // argument: "hsl(255,100%,50%)"
      
      function validateHex(hex) {
        return /(^#?[0-9A-F]{6}$)|(^#?[0-9A-F]{3}$)/i.test(hex);
      }
      
      function validateRgb(rgb) {
        return /^rgb\((\s*\d{1,3}\s*),(\s*\d{1,3}\s*),(\s*\d{1,3}\s*)\)$/.test(rgb);
      }
      
      function validateHsl(HSL) {
        return /^hsl\((\s*\d{1,3}\s*),(\s*\d{1,3}%\s*),(\s*\d{1,3}%\s*)\)$/.test(HSL);
      }
      
      function display_hex(ry){
        var hex = "#" + ry[0] + ry[1] + ry[2];
        if(validateHex(hex)){return hex;}else{return false;}
      }
      
      function display_rgb(ry){
        var rgb = "rgb(" + Math.round(ry[0]) +","+  Math.round(ry[1]) +","+  Math.round(ry[2]) + ")";
        if(validateRgb(rgb)){return rgb;}else{return false;}
      }
      
      function display_hsl(ry){
        var hsl = "hsl(" +  Math.round(ry[0]) +","+  Math.round(ry[1]) +"%,"+  Math.round(ry[2]) + "%)";
        if(validateHsl(hsl)){return hsl;}else{return false;}
      }
      
      
      function getRelativeLuminance(rgb) {// var rgb = [255,0,0]; 
          var rgb = rgb.map(function(c) {
            c /= 255;
            return c < .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
        
          });
        
          return (21.26 * rgb[0] + 71.52 * rgb[1] + 7.22 * rgb[2]) / 100
        }
        
        function colorContrast(c1, c2) {
          var l1 = getRelativeLuminance(c1);
          var l2 = getRelativeLuminance(c2);
          var ret = (l1 + .05) / (l2 + .05);
          // 0.05 for not dividing with 0
          return ret < 1 ? 1 / ret : ret;
        }
        
        
        function getFontColor(rgbRy,p){
          if(colorContrast(rgbRy, [255,255,255]) > 4.5){p.style.color = "white";}else{p.style.color = "black";}
        }
        
      
      function getFontColor(rgbRy) {
          if (colorContrast(rgbRy, [255, 255, 255]) > 4.5) {
            return "white";
          } else {
            return "black";
          }
        }
        
        var palette = document.querySelector(".palette");
        var img = document.getElementById("img");
        var viewColor = document.querySelector(".viewColor");// the current color
        var colorsRy = [];
        var imgW = 800;
        var canvas = document.getElementById("canvas_bomb");
        var ctx = canvas.getContext("2d");
        var cw = canvas.width = imgW; //img.width,
        cx = cw / 2;
        var ch = canvas.height = imgW * img.height / img.width,
          cy = ch / 2;
        
        //draw the first image on the canvas
        ctx.drawImage(img, 0, 0, cw, ch);
        // get the Image Data
        var imgData = ctx.getImageData(0, 0, cw, ch);
        var pixels = imgData.data;
        var thisRGB;
        var thisRGBRy;

        //set custom Cursor
        //canvas.style.cursor = 'url(https://cur.cursors-4u.net/nature/nat-11/nat1021.cur), default';
        canvas.style.cursor = 'url(assets/images/mouseIcon/plier.cur), default';
        
        // on mousemove you get the current color
        canvas.addEventListener("mousemove", function(e) {
          var m = oMousePos(canvas, e);
        
          var i = (m.x + m.y * cw) * 4;
          var R = pixels[i];
          var G = pixels[i + 1];
          var B = pixels[i + 2];
          thisRGBRy = [R, G, B];
          thisRGB = display_rgb(thisRGBRy);
          viewColor.style.backgroundColor = thisRGB;
          viewColor.style.color = getFontColor(thisRGBRy);
          //viewColor.innerHTML =  thisRGB;
        
        }, false);
        
        
        function Swatch(RGBry, parent) {
          this.element = document.createElement("div");
        
          this.rgb = display_rgb(RGBry);
          this.hex = display_hex(rgb2hex(RGBry));
          this.hsl = display_hsl(rgb2hsl(RGBry));
          
          this.att = {}
          this.att.class = "swatch";
          this.att.style = "background-color:" + this.rgb + "; color:" + getFontColor(RGBry) + ";";
          for (var name in this.att) {
            if (this.att.hasOwnProperty(name)) {
              this.element.setAttribute(name, this.att[name]);
            }
          }
          this.element.innerHTML = this.hex + "<br>" + this.rgb + "<br>" + this.hsl;
          parent.appendChild(this.element)
        }
        
        canvas.addEventListener("click", function(e) {
          // add swatch on click
          var swatch = new Swatch(thisRGBRy, palette);
          colorsRy.push(swatch);
          // get the colors string
          var colorsStr = getColorsStr(colorsRy);
          console.clear();
          console.log(colorsStr);
        
        }, false);
        
        palette.addEventListener("dblclick", function(e) {
          // remove swatch on dblclick
          if (e.target.className == "swatch") {
            for (var i = 0; i < colorsRy.length; i++) {
              if (colorsRy[i].element == e.target) {
                colorsRy.splice(i, 1);
                palette.removeChild(e.target);
                break;
              }
            }
          }
        
          var colorsStr = getColorsStr(colorsRy);
          console.clear();
          console.log(colorsStr);
        
        }, false);
        
        function clearSwatches(parent) {
          while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
          }
        }
        
        function getColorsStr(colorsRy) {
          var colorsStr = ''
          for (var i = 0; i < colorsRy.length; i++) {
            colorsStr += '['+colorsRy[i].hex + ','+ colorsRy[i].rgb + ','+ colorsRy[i].hsl+']';
            if(i < colorsRy.length-1){colorsStr += ',\n';};
          }
          return colorsStr;
        }
        
        function oMousePos(canvas, evt) {
          var ClientRect = canvas.getBoundingClientRect();
          return { //objeto
            x: Math.round(evt.clientX - ClientRect.left),
            y: Math.round(evt.clientY - ClientRect.top)
          }
        }




};