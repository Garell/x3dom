/**
 * Created by Sven on 04.11.2016.
 */

if(x3dom.glTF == null)
    x3dom.glTF = {};

x3dom.glTF.glTFTexture = function(gl, format, internalFormat, sampler, target, type, image)
{
    this.format = format;
    this.internalFormat = internalFormat;
    this.sampler = sampler;
    this.target = target;
    this.type = type;
    this.image = image;

    this.created = false;

    this.create(gl);
};

x3dom.glTF.glTFTexture.prototype.isPowerOfTwo = function(x)
{
    var powerOfTwo = !(x == 0) && !(x & (x - 1));
    return powerOfTwo;
};

x3dom.glTF.glTFTexture.prototype.create = function(gl)
{
    if(this.image.complete == false)
        return;

    this.glTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.format, this.type, this.image);

    if(this.sampler.magFilter != null)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.sampler.magFilter);

    if(this.sampler.minFilter != null)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.sampler.minFilter);

    //if(!this.isPowerOfTwo(this.image.width)||!this.isPowerOfTwo(this.image.height)){
    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //}

    //gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.created = true;
};

x3dom.glTF.glTFTexture.prototype.bind = function(gl, textureUnit, shaderProgram, uniformName)
{
    if(!this.created)
        this.create(gl);

    gl.activeTexture(gl.TEXTURE0+textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, uniformName), textureUnit);
};