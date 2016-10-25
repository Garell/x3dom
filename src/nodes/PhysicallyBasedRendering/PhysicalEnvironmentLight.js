/**
 * Created by skluge on 24.10.2016.
 */
/** @namespace x3dom.nodeTypes */
/*
 * X3DOM JavaScript Library
 * http://www.x3dom.org
 *
 * (C)2009 Fraunhofer IGD, Darmstadt, Germany
 * Dual licensed under the MIT and GPL
 */

x3dom.registerNodeType(
    "PhysicalEnvironmentLight",
    "PhysicallyBasedRendering",
    defineClass(x3dom.nodeTypes.X3DEnvironmentLight,

        /**
         * Constructor for PhysicalEnvironmentLight
         * @constructs x3dom.nodeTypes.PhysicalEnvironmentLight
         * @x3d 3.3
         * @component EnvironmentalEffects
         * @status full
         * @extends x3dom.nodeTypes.X3DBindableNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         * @classdesc
         */
        function (ctx) {
            x3dom.nodeTypes.PhysicalEnvironmentLight.superClass.call(this, ctx);

            /**
             * Texture containing the environment map.
             * @var {x3dom.fields.SFNode} envMap
             * @memberof x3dom.nodeTypes.PhysicalEnvironmentLight
             * @initvalue x3dom.nodeTypes.X3DEnvironmentTextureNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('specular', x3dom.nodeTypes.X3DEnvironmentTextureNode);

            /**
             * Texture containing the environment map.
             * @var {x3dom.fields.SFNode} envMap
             * @memberof x3dom.nodeTypes.PhysicalEnvironmentLight
             * @initvalue x3dom.nodeTypes.X3DEnvironmentTextureNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('diffuse', x3dom.nodeTypes.X3DEnvironmentTextureNode);

            /**
             * Texture containing the BRDF Lookup.
             * @var {x3dom.fields.SFNode} BRDF
             * @memberof x3dom.nodeTypes.PhysicalEnvironmentLight
             * @initvalue x3dom.nodeTypes.X3DTextureNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('BRDF', x3dom.nodeTypes.X3DTextureNode);

            /**
             * Number of Mipmaps Levels to generate for the Specular and Diffuse Environment Maps
             * @var {x3dom.fields.SFVec3f} albedoFactor
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue 0,0,0
             * @field x3dom
             * @instance
             */
            this.addField_SFInt32(ctx, 'genLevel', 5);

            this._dirty = true;
            this.textures = {};
            this._dirtyTextures = {
                "specularMipmaps": true,
                "diffuseMipmaps": true,
                "specular": true,
                "diffuse": true,
                "BRDF": true
            };
        },
        {
            getSpecularMap: function(){
                return this.getMap(this._cf.specular.node, "specular")
            },

            getDiffuseMap: function(){
                return this.getMap(this._cf.diffuse.node, "diffuse")
            },

            getBRDF: function(){
                return this.getMap(this._cf.BRDF.node, "BRDF")
            },

            getMap: function(textureNode, type)
            {
                if(textureNode) {
                    textureNode._type = type;
                    return textureNode;
                } else {
                    return null;
                }
            },

            setup: function(gl, doc, cache)
            {
                if(this._dirty == true)
                {
                    if(this._cf.specular.node){
                        if(this._dirtyTextures.specular){
                            this.textures.specular = new x3dom.Texture(gl, doc, cache, this.getSpecularMap());
                            this._dirtyTextures.specular = false;
                        }

                        if(this.textures.specular.texture.textureCubeReady && this._dirtyTextures.specularMipmaps){
                            this.textures.specularMipmaps = x3dom.shader.pbr.util.createPrefilteredEnvMipmaps(gl, this.textures.specular.texture, 1024, 1024, this._vf.genLevel);
                            this._dirtyTextures.specularMipmaps = false;
                        }
                    }

                    if(this._cf.diffuse.node){
                        if(this._dirtyTextures.diffuse){
                            this.textures.diffuse = new x3dom.Texture(gl, doc, cache, this.getDiffuseMap());
                            this._dirtyTextures.diffuse = false;
                        }

                        if(this.textures.diffuse.texture.textureCubeReady && this._dirtyTextures.diffuseMipmaps){
                            this.textures.diffuseMipmaps = x3dom.shader.pbr.util.createPrefilteredEnvMipmaps(gl, this.textures.diffuse.texture, 1024, 1024, this._vf.genLevel);
                            this._dirtyTextures.diffuseMipmaps = false;
                        }
                    }

                    if(!this._cf.BRDF.node){
                        if(this._dirtyTextures.BRDF){
                            this.textures.BRDF = x3dom.shader.pbr.util.renderBRFDToTexture(gl, null);
                            this._dirtyTextures.BRDF = false;
                        }
                    }else if(this._dirtyTextures.BRDF)
                    {
                        this.textures.BRDF = new x3dom.Texture(gl, doc, cache, this.getBRDF());
                        this._dirtyTextures.BRDF = false;
                    }

                    var dirty = false;
                    for(var k in this._dirtyTextures){
                        if(!this._dirtyTextures.hasOwnProperty)continue;
                        if(this._dirtyTextures){
                            dirty = true;
                            break;
                        }
                    }
                    this._dirty = dirty;
                }
            }
        }
    )
);