/**
 * Created by Sven on 04.11.2016.
 */

if(x3dom.glTF == null)
    x3dom.glTF = {};

x3dom.glTF.glTFMaterial = function(technique)
{
    this.technique = technique;
    this.values = {};
    this.semanticMapping = {};
    this.attributeMapping = {};
    this.textures = {};

    for(var key in this.technique.uniforms)
    {
        if(this.technique.uniforms.hasOwnProperty(key))
        {
            var parameter = this.technique.parameters[this.technique.uniforms[key]];
            if(parameter.semantic != null)
                switch(parameter.semantic)
                {
                    case "MODELVIEW":
                        this.semanticMapping["modelViewMatrix"] = key;
                        break;
                    case "MODELVIEWINVERSETRANSPOSE":
                        this.semanticMapping["modelViewInverseTransposeMatrix"] = key;
                        break;
                    case "PROJECTION":
                        this.semanticMapping["projectionMatrix"] = key;
                        break;
                    case "MODEL":
                        this.semanticMapping["modelMatrix"] = key;
                        break;
                    case "MODELVIEWPROJECTION":
                        this.semanticMapping["modelViewProjectionMatrix"] = key;
                        break;
                    case "VIEW":
                        this.semanticMapping["viewMatrix"] = key;
                        break;
                    case "MODELVIEWINVERSE":
                        this.semanticMapping["modelViewInverseMatrix"] = key;
                        break;
                    default:
                        break;
                }
        }
    }

    for(var key in this.technique.attributes) {
        if (this.technique.attributes.hasOwnProperty(key)) {
            var parameter = this.technique.parameters[this.technique.attributes[key]];
            if (parameter.semantic != null)
                switch (parameter.semantic) {
                    case "POSITION":
                        this.attributeMapping[glTF_BUFFER_IDX.POSITION] = key;
                        break;
                    case "NORMAL":
                        this.attributeMapping[glTF_BUFFER_IDX.NORMAL] = key;
                        break;
                    case "TEXCOORD_0":
                        this.attributeMapping[glTF_BUFFER_IDX.TEXCOORD] = key;
                        break;
                    case "COLOR":
                        this.attributeMapping[glTF_BUFFER_IDX.COLOR] = key;
                        break;
                    default:
                        break;
                }
        }
    }
};

x3dom.glTF.glTFMaterial.prototype.created = function()
{
    for(var key in this.textures){
        if(!this.textures.hasOwnProperty(key)) continue;

        if(this.textures[key].created != true)
            return false;
    }

    return true;
};

x3dom.glTF.glTFMaterial.prototype.bind = function(gl, shaderParameter)
{
    if(this.program != null)
        this.program.bind();

    this.updateTransforms(shaderParameter);

    for(var key in this.technique.uniforms)
        if(this.technique.uniforms.hasOwnProperty(key))
        {
            var uniformName = this.technique.uniforms[key];
            if(this.textures[uniformName] != null){
                var texture = this.textures[uniformName];
                texture.bind(gl, 0, this.program.program, key);
            }
            else if(this.values[uniformName] != null)
                this.program[key] = this.values[uniformName];
        }
};

x3dom.glTF.glTFMaterial.prototype.updateTransforms = function(shaderParameter)
{
    if(this.program != null)
    {
        this.program.bind();

        if(this.semanticMapping["modelViewMatrix"] != null)
            this.program[this.semanticMapping["modelViewMatrix"]] = shaderParameter.modelViewMatrix;

        if(this.semanticMapping["viewMatrix"] != null)
            this.program[this.semanticMapping["viewMatrix"]] = shaderParameter.viewMatrix;

        if(this.semanticMapping["modelViewInverseTransposeMatrix"] != null) {
            var mat = shaderParameter.normalMatrix;

            var model_view_inv_gl =
                [mat[0], mat[1], mat[2],
                    mat[4],mat[5],mat[6],
                    mat[8],mat[9],mat[10]];

            this.program[this.semanticMapping["modelViewInverseTransposeMatrix"]] = model_view_inv_gl;
        }

        if(this.semanticMapping["modelViewInverseMatrix"] != null)
            this.program[this.semanticMapping["modelViewInverseMatrix"]] = shaderParameter.modelViewMatrixInverse;

        if(this.semanticMapping["modelViewProjectionMatrix"] != null)
            this.program[this.semanticMapping["modelViewProjectionMatrix"]] = shaderParameter.modelViewProjectionMatrix;

        if(this.semanticMapping["modelMatrix"] != null)
            this.program[this.semanticMapping["modelMatrix"]] = shaderParameter.model;

        if(this.semanticMapping["projectionMatrix"] != null)
            this.program[this.semanticMapping["projectionMatrix"]] = shaderParameter.projectionMatrix;
    }

};