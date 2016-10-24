/**
 * Created by skluge on 20.10.2016.
 */
/** @namespace x3dom.nodeTypes */
/*
 * X3DOM JavaScript Library
 * http://www.x3dom.org
 *
 * (C)2009 Fraunhofer IGD, Darmstadt, Germany
 * Dual licensed under the MIT and GPL
 */

/* ### Material ### */
x3dom.registerNodeType(
    "PhysicalMaterial",
    "PhysicallyBasedRendering",
    defineClass(x3dom.nodeTypes.X3DMaterialNode,

        /**
         * Constructor for PhysicalMaterial
         * @constructs x3dom.nodeTypes.PhysicalMaterial
         * @x3d 3.3
         * @component Shape
         * @status full
         * @extends x3dom.nodeTypes.X3DMaterialNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         * @classdesc
         */
        function (ctx) {
            x3dom.nodeTypes.PhysicalMaterial.superClass.call(this, ctx);

            /**
             * Texture containing albedo map.
             * @var {x3dom.fields.SFNode} albedoMap
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue x3dom.nodeTypes.X3DTextureNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('albedoMap', x3dom.nodeTypes.X3DTextureNode);

            /**
             * Texture containing roughness map.
             * @var {x3dom.fields.SFNode} roughnessMap
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue x3dom.nodeTypes.X3DTextureNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('roughnessMap', x3dom.nodeTypes.X3DTextureNode);

            /**
             * Texture containing metallic map.
             * @var {x3dom.fields.SFNode} metallicMap
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue x3dom.nodeTypes.X3DTextureNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('metallicMap', x3dom.nodeTypes.X3DTextureNode);

            /**
             * Constant Albedo Factor
             * @var {x3dom.fields.SFVec3f} albedoFactor
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue 0,0,0
             * @field x3dom
             * @instance
             */
            this.addField_SFVec3f(ctx, 'albedoFactor', 0, 0, 0);

            /**
             * Constant Roughness Factor
             * @var {x3dom.fields.SFFloat} roughnessFactor
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue 0
             * @field x3dom
             * @instance
             */
            this.addField_SFFloat(ctx, 'roughnessFactor', 0);

            /**
             * Constant Metallic Factor
             * @var {x3dom.fields.SFFloat} metallicFactor
             * @memberof x3dom.nodeTypes.PhysicalMaterial
             * @initvalue 0
             * @field x3dom
             * @instance
             */
            this.addField_SFFloat(ctx, 'metallicFactor', 0);

        },
        {
            fieldChanged: function(fieldName) {
                if (fieldName == "albedoMap" || fieldName == "albedoFactor" ||
                    fieldName == "roughnessMap" || fieldName == "roughnessFactor" ||
                    fieldName == "metallicMap" || fieldName == "metallicFactor")
                {
                    Array.forEach(this._parentNodes, function (app) {
                        Array.forEach(app._parentNodes, function (shape) {
                            shape._dirty.material = true;
                        });
                        app.checkSortType();
                    });
                }
            },

            getAlbedoMap: function(){
                return this.getMap(this._cf.albedoMap.node, "albedoMap")
            },

            getMetallicMap: function(){
                return this.getMap(this._cf.metallicMap.node, "metallicMap")
            },

            getRoughnessMap: function(){
                return this.getMap(this._cf.roughnessMap.node, "roughnessMap")
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

            getTextures: function(){
                var textures = [];

                var diff = this.getAlbedoMap();
                if(diff) textures.push(diff);

                var metallic = this.getMetallicMap();
                if(metallic) textures.push(metallic);

                var roughness = this.getRoughnessMap();
                if(roughness) textures.push(roughness);

                return textures;
            }
        }
    )
);
