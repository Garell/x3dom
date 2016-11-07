/**
 * Created by Sven on 04.11.2016.
 */

if(x3dom.glTF == null)
    x3dom.glTF = {};

x3dom.glTF.glTFQuantizedAttribute = function(accessor){

    if(!accessor['extensions'] || !accessor['extensions']['WEB3D_quantized_attribute'])
        return null;

    this.accessor = accessor;


};