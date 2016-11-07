/**
 * Created by Sven on 04.11.2016.
 */

if(x3dom.glTF == null)
    x3dom.glTF = {};

glTF_KHR_MATERIAL_COMMON_TECHNIQUE =
{
    BLINN : 0,
    PHONG : 1,
    LAMBERT : 2,
    CONSTANT : 3
};

x3dom.glTF.glTFKHRMaterialCommons = function()
{
    this.diffuse = [0.3,0.1,0.1,1];
    this.diffuseTex = null;

    this.emission = [0.0,0.0,0.0,1];
    this.emissionTex = null;

    this.specular = [0.8,0.8,0.8,1];
    this.specularTex = null;

    this.ambient = [0,0,0,1];

    this.shininess = 2;
    this.transparency = 0.0;

    this.globalAmbient = [0,0,0,1];
    this.lightVector = [1,0,0,1];

    this.doubleSided = false;

    this.technique = glTF_KHR_MATERIAL_COMMON_TECHNIQUE.BLINN;
};

x3dom.glTF.glTFKHRMaterialCommons.prototype.created = function()
{
    if(this.diffuseTex != null && this.diffuseTex.created != true)
        return false;

    if(this.emissionTex != null && this.emissionTex.created != true)
        return false;

    if(this.specularTex != null && this.specularTex.created != true)
        return false;

    return true;
};

x3dom.glTF.glTFKHRMaterialCommons.prototype.setShader = function(gl, cache, shape, properties)
{

    properties.EMPTY_SHADER = 0;

    properties.KHR_MATERIAL_COMMONS = 1;

    if(this.diffuseTex != null)
        properties.USE_DIFFUSE_TEX = 1;
    else
        properties.USE_DIFFUSE_TEX = 0;

    if(this.emissionTex != null)
        properties.USE_SPECULAR_TEX = 1;
    else
        properties.USE_SPECULAR_TEX = 0;

    if(this.specularTex != null)
        properties.USE_EMISSION_TEX = 1;
    else
        properties.USE_EMISSION_TEX = 0;

    properties.toIdentifier();

    this.program = cache.getShaderByProperties(gl, shape, properties);

};

x3dom.glTF.glTFKHRMaterialCommons.prototype.bind = function(gl, shaderProgram)
{
    this.program.bind();


    // set all used Shader Parameter
    for(var key in shaderProgram){
        if(!shaderProgram.hasOwnProperty(key))
            continue;

        if(this.program.hasOwnProperty(key))
            this.program[key] = shaderProgram[key];
    }

    if(this.diffuseTex != null)
        this.diffuseTex.bind(gl, 0, this.program.program, "diffuseTex");
    else
        this.program.diffuse = this.diffuse;

    if(this.emissionTex != null)
        this.emissionTex.bind(gl, 0, this.program.program, "emissionTex");
    else
        this.program.emission = this.emission;

    if(this.specularTex != null)
        this.specularTex.bind(gl, 0, this.program.program, "specularTex");
    else
        this.program.specular = this.specular;

    this.program.shininess = this.shininess;
    this.program.transparency = this.transparency;
    this.program.globalAmbient = this.globalAmbient;
    this.program.lightVector = this.lightVector;

    this.program.technique = this.technique;
};