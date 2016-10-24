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

            this._dirty = true;
            this.textures = {};

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
                        if(!this.textures.specular)
                            this.textures.specular = new x3dom.Texture(gl, doc, cache, this.getSpecularMap());

                        if(this.textures.specular.texture.textureCubeReady)
                            this.textures.specularMipmaps = x3dom.shader.pbr.util.createPrefilteredEnvMipmaps(gl, this.textures.specular.texture, 1024, 1024, 10);
                    }

                    if(this._cf.diffuse.node){
                        if(!this.textures.diffuse)
                            this.textures.diffuse = new x3dom.Texture(gl, doc, cache, this.getDiffuseMap());

                        if(this.textures.diffuse.texture.textureCubeReady)
                            this.textures.diffuseMipmaps = x3dom.shader.pbr.util.createPrefilteredEnvMipmaps(gl, this.textures.diffuse.texture, 1024, 1024, 10);
                    }

                    if(!this._cf.BRDF.node){
                        if(!this.textures.BRDF)
                            this.textures.BRDF = x3dom.shader.pbr.util.renderBRFDToTexture(gl, null);
                    }else
                    {
                        this.textures.BRDF = new x3dom.Texture(gl, doc, cache, this.getBRDF());
                    }
                }
            }
        }
    )
);