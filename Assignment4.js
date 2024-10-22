// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec3 position;' +
    'uniform mat4 Pmatrix;'+ // projection matrix
    'uniform mat4 Vmatrix;'+ // view matrix
    'uniform mat4 Mmatrix;'+ // model matrix
    'attribute vec3 color;'+ // the color of the vertex
    'varying vec3 vColor;'+
  'void main() {\n' +
    'gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);\n' +
    'vColor = color;'+
  '}\n';
  
// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;'+
    'varying vec3 vColor;'+
  'void main() {\n' +
  '  gl_FragColor = vec4(vColor, 1.0);\n' +
  '}\n';

  var finalXPos = 0;
  var finalYPos = 0;
  var dXPos = 0;
  var dYPos = 0;
  var Angles = [0,0];
  var isRotating = false;

  var count = 10;
  var bacteria =[];
  var BacR = [1.001,1.002,1.003,1.004,1.005,1.006,1.007,1.008,1.009,1.010];

  var bacteriaSizing = 2;
  var gameOver = false;
  var Finished = false;
  var scoring = 0;

  var bacColour = [[1,0,0,1],[0,1,0,1],[0,0,1,1],
                    [1,1,0,1],[1,0,1,1],[0,1,1,1],
                    [0.5,0,0,1],[0,0.5,0,1],[0,0.8,0.8,1], [1,1,1,1]];

  for(var i = 0; i < count; i++){
    var firstAngle = (Math.random()*160)-90;
    var secondAngle = (Math.random()*360);
    var getColour = bacColour[i];
    var getR = BacR[i];
    bacteria.push({num: i, x : firstAngle, y : secondAngle, colour: getColour, r : getR});
  }

function main(){
  var canvas = document.getElementById('webgl');
  var gl = canvas.getContext("webgl",{preserveDrawingBuffer: true});
  if(!gl){
    console.log('Cant obtain rendering content');
    return;
  }
  if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
    console.log('Failed to get intializers');
    return;
  }

  //Making matrices to get projection, view and model 
  var PMatrix = new Matrix4();
  var VMatrix = new Matrix4();
  var MMatrix = new Matrix4();
  
  PMatrix.setPerspective(30,canvas.width/canvas.height,1,100);
  VMatrix.setLookAt(0,0,5,0,0,0,0,1,0);

  var _Pmatrix = gl.getUniformLocation(gl.program,'Pmatrix');
  var _Vmatrix = gl.getUniformLocation(gl.program,'Vmatrix');
  var _Mmatrix = gl.getUniformLocation(gl.program,'Mmatrix');

  //checks whether the player is rotating the sphere
canvas.onmousedown = function(event){
    var xPos = event.clientX;
    var yPos = event.clientY;
    var rectangle = event.target.getBoundingClientRect();
    if(rectangle.left <= xPos && xPos < rectangle.right && rectangle.top <= yPos && yPos < rectangle.bottom){
      finalXPos = xPos; finalYPos = yPos;
      isRotating = true;
    }
  };

canvas.onmouseup = function(event){
  isRotating = false;
}

canvas.onmousemove = function(event){
    var xPos = event.clientX;
    var yPos = event.clientY;
    if(isRotating == true){
      dXPos = 100/canvas.height * (xPos - finalXPos);
      dYPos = 100/canvas.height * (yPos - finalYPos);
      Angles[0] = Math.max(Math.min(Angles[0]+dYPos,100),-100);
      Angles[1] += dXPos;
    }
    finalXPos = xPos; finalYPos = yPos;
  }
  
  canvas.onclick = function(event){
    var xPos = event.clientX;
    var yPos = 400-event.clientY;
    var pixColour = new Uint8Array(4);
    gl.readPixels(xPos,yPos,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixColour);
    var red = (pixColour[0]/255).toFixed(1);
    var green = (pixColour[1]/255).toFixed(1);
    var blue = (pixColour[2]/255).toFixed(1);
    var alpha = (pixColour[3]/255).toFixed(1);
    var colours = [red,green,blue,alpha];
    console.log(colours);
    if(gameOver == false){
      eraseBac(colours,bacteria);
    }
  }


function tick(){
  MMatrix.setRotate(Angles[0],1,0,0);
  MMatrix.rotate(Angles[1],0,1,0);

  gl.uniformMatrix4fv(_Pmatrix,false,PMatrix.elements);
  gl.uniformMatrix4fv(_Vmatrix,false,VMatrix.elements);
  gl.uniformMatrix4fv(_Mmatrix,false,MMatrix.elements);

  gl.clearColor(0,0,0,1);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  
  if(bacteriaSizing< 30){
    bacteriaSizing += 0.04;
    draw(gl,count,bacteriaSizing);
  }else{
    draw(gl,count,bacteriaSizing);
    gameOver = true;
  }
  document.getElementById("Score").innerHTML= "Score: " + scoring;
  if(gameOver == true){
    document.getElementById("Score").innerHTML = "Game Over! You Failed to remove all of the bacteria! Your final score is " + scoring + ".Try again.";
  }
  if(Finished == true){
    document.getElementById("Score").innerHTML = "Victory! You killed all of the bacteria! Your final Score is " + scoring;
  }
  requestAnimationFrame(tick,canvas);
};
tick();
}

function draw(gl,count){
  var n = Shape(gl,true);
  gl.drawElements(gl.TRIANGLES,n,gl.UNSIGNED_SHORT,0);
  for(var i = 0; i < count; i++){
    n = Shape(gl,false,bacteria[i].r,bacteria[i].colour,bacteria[i].x,bacteria[i].y);
    gl.drawElements(gl.TRIANGLES,n,gl.UNSIGNED_SHORT,0);
  }
}

function eraseBac(colours,bacteria){
  for(var i =0; i< count; i++){
    var red = bacteria[i].colour[0];
    var green = bacteria[i].colour[1];
    var blue = bacteria[i].colour[2];
    var alpha = bacteria[i].colour[3];
    if(Math.abs(red-colours[0]) <= 0.1 && Math.abs(green-colours[1]) <= 0.1 
    && Math.abs(blue-colours[2]) <= 0.1 && Math.abs(alpha-colours[3]) <= 0.1){
      bacteria.splice(i,1);
      count--;
      if(bacteriaSizing<10){
        scoring += 30;
      }
      if(bacteriaSizing > 10 && bacteriaSizing < 20){
        scoring += 20;
      }
      if(bacteriaSizing > 20){
        scoring +=10;
      }
      if(count == 0){
        Finished = true;
      }
    }
  }
}

function Shape(gl,notBac,BacR,bacColour,firstAngle,secondAngle){
var lat = 100;
var long = 100;
  if(notBac==true){
    var r = 1;
    var circleColour = [0.6,0.6,0.6,1];
    var dots = [1,1,1,1];
    var info = makeSphere(r,lat,long,circleColour,dots);
    var vertex = new Float32Array([...info.vertex]);
    var index = new Uint16Array([...info.index]);
    return initVertexBuffers(gl,vertex,index,info);
  }else{
    var info = makeBacteria(BacR,lat,long,bacColour,firstAngle,secondAngle);
    var vertex = new Float32Array([...info.vertex]);
    var index = new Uint16Array([...info.index]);
    return initVertexBuffers(gl,vertex,index,info);
  }
}


function makeSphere(r,maxLatitude,maxLongitude,circleColour,pointsColour){
  var vertex =[];
  for( var numOfLatitudes=0; numOfLatitudes<=maxLatitude; numOfLatitudes++){
    var angleSize = numOfLatitudes*Math.PI/maxLatitude;
    var sinAngle = Math.sin(angleSize);
    var cosAngle = Math.cos(angleSize);
    for(var numOfLongitudes=0; numOfLongitudes<= maxLongitude; numOfLongitudes++){
      var angleSize2 = numOfLongitudes*2*Math.PI/maxLongitude;
      var sinAngle2 = Math.sin(angleSize2);
      var cosAngle2 = Math.cos(angleSize2);

      var x = cosAngle2 * sinAngle;
      var y = cosAngle;
      var z = sinAngle2 * sinAngle;

      if(numOfLatitudes%10==0 && numOfLongitudes%10 ==0){
        var red = pointsColour[0];
        var green = pointsColour[1];
        var blue = pointsColour[2];
        var alpha = pointsColour[3];
      }else{
        var red = circleColour[0];
        var green = circleColour[1];
        var blue = circleColour[2];
        var alpha = circleColour[3];
      }
      vertex.push(r*x,r*y,r*z);
      vertex.push(red,green,blue,alpha);
    }
  }
  var index =[];
  for(var numOfLatitudes=0; numOfLatitudes< maxLatitude; numOfLatitudes++){
    for(var numOfLongitudes=0; numOfLongitudes< maxLongitude; numOfLongitudes++){
      var first = (numOfLatitudes*(maxLongitude+1))+numOfLongitudes;
      var second = first + maxLongitude +1;
      index.push(first,second,first+1);
      index.push(second,second+1,first+1);
    }
  }
  return{
    vertex: new Float32Array(vertex),
    index: new Uint16Array(index),
  };
}



function makeBacteria(r,maxLatitude,maxLongitude,bacColour,firstAngle,secondAngle){
  var vertex = [];
  for(var numOfLatitudes=0; numOfLatitudes<=maxLatitude;numOfLatitudes++){
      var angleSize = numOfLatitudes*Math.PI/maxLatitude;
      var sinAngle = Math.sin(angleSize);
      var cosAngle = Math.cos(angleSize);
      for(var numOfLongitudes=0; numOfLongitudes<=maxLongitude;numOfLongitudes++){
        var angleSize2 = numOfLongitudes*2*Math.PI/maxLongitude;
        var sinAngle2 = Math.sin(angleSize2);
        var cosAngle2 = Math.cos(angleSize2);
        var x = r * cosAngle2 * sinAngle;
        var y = r * cosAngle;
        var z = r * sinAngle2 * sinAngle;
        
        var red = bacColour[0];
        var green = bacColour[1];
        var blue = bacColour[2];
        var alpha = bacColour[3];

        var rotation = rotatingVertex([x,y,z],firstAngle,secondAngle);
        vertex.push(rotation[0]);
        vertex.push(rotation[1]);
        vertex.push(rotation[2]);

        vertex.push(red,green,blue,alpha);
      }
    }

    var index =[];
    for(var numOfLatitudes =0; numOfLatitudes < maxLatitude; numOfLatitudes++){
      for(var numOfLongitudes=0; numOfLongitudes< maxLongitude; numOfLongitudes++){
        var first = (numOfLatitudes *(maxLongitude+1))+numOfLongitudes;
        var second = first + maxLongitude+1;
        if(numOfLatitudes<bacteriaSizing){
          index.push(first,second,first+1);
          index.push(second,second+1,first+1);
        }
      }
    }
    return {
      vertex: new Float32Array(vertex),
      index: new Uint16Array(index),
    };
    }
    
  function rotatingVertex(vertex,firstAngle,secondAngle){
    var x = vertex[0];
    var y = vertex[1];
    var z = vertex[2];
    var rotatingX = x;
    var rotatingY = y * Math.cos(firstAngle)-z*Math.sin(firstAngle);
    var rotatingZ = y * Math.sin(firstAngle)+z*Math.cos(firstAngle);

    x = rotatingX * Math.cos(secondAngle) + rotatingZ * Math.sin(secondAngle);
    y = rotatingY;
    z = -rotatingX * Math.sin(secondAngle) + rotatingZ * Math.cos(secondAngle);
    return [x,y,z];
  }

  function initVertexBuffers(gl,vertex,index,info){
    var vertexBuffer = gl.createBuffer();
    if(!vertexBuffer){
      console.log('buffer object was not created');
      return -1;
    }
    var indexBuffer = gl.createBuffer();
    if(!indexBuffer){
      console.log('Failed to create buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,vertex,gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,index,gl.STATIC_DRAW);

    var Sizing = info.vertex.BYTES_PER_ELEMENT;
    var a_Position = gl.getAttribLocation(gl.program,'position');
    if(a_Position<0){
      console.log('Failed to get a position');
      return -1;
    }
    gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,Sizing*7,0);
    gl.enableVertexAttribArray(a_Position);
    var a_Colour = gl.getAttribLocation(gl.program,'color');
    if(a_Colour<0){
      console.log('Failed to get colours');
      return -1;
    }
    gl.vertexAttribPointer(a_Colour,4,gl.FLOAT,false,Sizing*7,Sizing*3);
    gl.enableVertexAttribArray(a_Colour);
    return index.length;
  }