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
    "X3DEnvironmentLight",
    "PhysicallyBasedRendering",
    defineClass(x3dom.nodeTypes.X3DBindableNode,

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
            x3dom.nodeTypes.X3DEnvironmentLight.superClass.call(this, ctx);
        },
        {
            setup: function(gl, doc, cache, node)
            {
                
            }
        }
    )
);