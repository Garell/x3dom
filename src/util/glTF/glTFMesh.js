/**
 * Created by Sven on 04.11.2016.
 */

if(x3dom.glTF == null)
    x3dom.glTF = {};

glTF_BUFFER_IDX =
{
    INDEX : 0,
    POSITION : 1,
    NORMAL : 2,
    TEXCOORD : 3,
    COLOR : 4
};

x3dom.glTF.glTFMesh = function()
{
    this.indexOffset = 0;
    this.drawCount = 0;

    this.numFaces = 0;
    this.primitiveType = 0;

    this.numCoords = 0;

    this.buffers = {};

    this.material = null;

    this.quantized_attributes = null;
};

x3dom.glTF.glTFMesh.prototype.useWEB3D_quantized_attributes = function(matrix, min, max)
{
    this.quantized_attributes = {};
    this.quantized_attributes.matrix = matrix;
    this.quantized_attributes.min = min;
    this.quantized_attributes.max = max;
};

x3dom.glTF.glTFMesh.prototype.bindVertexAttribPointer = function(gl, shaderProgram)
{
    if(this.buffers[glTF_BUFFER_IDX.INDEX]){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers[glTF_BUFFER_IDX.INDEX].idx);
    }

    if(this.material != null && this.material.attributeMapping != null)
    {
        var mapping = this.material.attributeMapping;
        this._bindVertexAttribPointer(gl, shaderProgram[mapping[glTF_BUFFER_IDX.POSITION]], this.buffers[glTF_BUFFER_IDX.POSITION]);
        this._bindVertexAttribPointer(gl, shaderProgram[mapping[glTF_BUFFER_IDX.NORMAL]], this.buffers[glTF_BUFFER_IDX.NORMAL]);
        this._bindVertexAttribPointer(gl, shaderProgram[mapping[glTF_BUFFER_IDX.TEXCOORD]], this.buffers[glTF_BUFFER_IDX.TEXCOORD]);
        this._bindVertexAttribPointer(gl, shaderProgram[mapping[glTF_BUFFER_IDX.COLOR]], this.buffers[glTF_BUFFER_IDX.COLOR]);
    }
    else
    {
        this._bindVertexAttribPointer(gl, shaderProgram.position, this.buffers[glTF_BUFFER_IDX.POSITION]);
        this._bindVertexAttribPointer(gl, shaderProgram.normal, this.buffers[glTF_BUFFER_IDX.NORMAL]);
        this._bindVertexAttribPointer(gl, shaderProgram.texcoord, this.buffers[glTF_BUFFER_IDX.TEXCOORD]);
        this._bindVertexAttribPointer(gl, shaderProgram.color, this.buffers[glTF_BUFFER_IDX.COLOR]);
    }
};

x3dom.glTF.glTFMesh.prototype.bindVertexAttribPointerPosition = function(gl, shaderProgram, useMaterial)
{
    if(this.buffers[glTF_BUFFER_IDX.INDEX]){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers[glTF_BUFFER_IDX.INDEX].idx);
    }

    if(useMaterial == true && this.material != null && this.material.attributeMapping != null)
    {
        var mapping = this.material.attributeMapping;
        this._bindVertexAttribPointer(gl, shaderProgram[mapping[glTF_BUFFER_IDX.POSITION]], this.buffers[glTF_BUFFER_IDX.POSITION]);
    }
    else
    {
        this._bindVertexAttribPointer(gl, shaderProgram.position, this.buffers[glTF_BUFFER_IDX.POSITION]);
    }
};

x3dom.glTF.glTFMesh.prototype.hasQuantizedAttributes = function()
{
    return this.quantized_attributes != null;
};

x3dom.glTF.glTFMesh.prototype.applyQuantizedAttributes = function(sp)
{
    var modelViewProjectionMatrix = new x3dom.fields.SFMatrix4f();
    modelViewProjectionMatrix.setFromArray(sp.modelViewProjectionMatrix);

    sp.modelViewProjectionMatrix = this.quantized_attributes.matrix.mult(modelViewProjectionMatrix).toGL();
};

x3dom.glTF.glTFMesh.prototype._bindVertexAttribPointer = function(gl, shaderPosition, buffer)
{
    if(shaderPosition!=null && buffer != null)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.idx);
        gl.vertexAttribPointer(shaderPosition,
            buffer.numComponents, buffer.type, false,
            buffer.stride, buffer.offset);
        gl.enableVertexAttribArray(shaderPosition);
    }
};

x3dom.glTF.glTFMesh.prototype.render = function(gl, polyMode)
{
    if(this.material != null && !this.material.created())
        return;

    if(polyMode == null)
        polyMode = this.primitiveType;

    if(this.buffers[glTF_BUFFER_IDX.INDEX])
        gl.drawElements(polyMode, this.drawCount, this.buffers[glTF_BUFFER_IDX.INDEX].type, this.buffers[glTF_BUFFER_IDX.INDEX].offset);
    else
        gl.drawArrays(polyMode, 0, this.drawCount);
};