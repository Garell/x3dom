/**
 * Created by skluge on 19.10.2016.
 */

x3dom.shader.pbr = {};
x3dom.shader.pbr.util = {};

/**
 * @return {string}
 */
x3dom.shader.pbr.RenderFullscreenVertexShader = function(){
    var shaderPart =
        'precision mediump float;\n'+

        'attribute vec3 position;\n'+
        'attribute vec3 texcoord;\n'+

        'varying vec3 v_texCoord;\n'+
    
        'void main()\n'+
        '{\n'+
            'gl_Position = vec4(position.xy,0.0,1.0);\n'+
            'v_texCoord = texcoord;\n'+
        '}\n';

    return shaderPart;
};

/**
 * @return {string}
 */
x3dom.shader.pbr.RenderPBRVertexShader = function(){
  var shaderPart =
        'precision mediump float;\n'+

        'attribute vec3 position;\n'+
        'attribute vec3 texcoord;\n'+
        'attribute vec3 normal;\n'+

        'uniform mat4 modelViewProjectionMatrix;\n'+
        'uniform mat4 modelViewMatrix;\n'+
        'uniform mat4 normalMatrix;\n'+

        'varying vec3 v_texCoord;\n'+
        'varying vec3 v_normal;\n'+
        'varying vec3 v_eyeVector;\n'+

        'void main()\n'+
        '{\n'+
           ' gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n'+

            'v_normal = ((normalMatrix*vec4(normal, 0.0)).xyz);\n'+
            'v_texCoord = texcoord;\n'+
            'v_eyeVector = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);\n'+
        '}\n';

    return shaderPart;
};

/**
 * @return {string}
 */
x3dom.shader.pbr.PreCalcFragFunctions = function()
{
    var shaderPart =
    'float saturate(float x) {\n'+
        'return clamp(x, 0.0, 1.0);\n'+
    '}\n'+
    'float rnd(vec2 uv) {\n'+
        'return fract(sin(dot(uv, vec2(12.9898, 78.233) * 2.0)) * 43758.5453);\n'+
    '}\n'+
    'vec2 random(int i, int N) {\n'+
        'float sini = sin(float(i));\n'+
        'float cosi = cos(float(i));\n'+
        'float rand = rnd(vec2(sini, cosi));\n'+

        'return vec2(float(i)/float(N), rand);\n'+
    '}\n'+

    'float G1V_Epic(float Roughness, float NoV)\n'+
    '{\n'+
        // no hotness remapping for env BRDF as suggested by Brian Karis
        'float k = (Roughness) * (Roughness);\n'+

        'return NoV / (NoV * (1.0 - k) + k);\n'+
    '}\n'+

    'float G_Smith(float Roughness, float NoV, float NoL)\n'+
    '{\n'+
        'return G1V_Epic(Roughness, NoV) * G1V_Epic(Roughness, NoL);\n'+
    '}\n'+

    'vec3 ImportanceSampleGGX(vec2 Xi, float Roughness, vec3 N)\n'+
    '{\n'+
        'float a = Roughness * Roughness;\n'+

        'float Phi = 2.0 * M_PI * Xi.x;\n'+
        'float CosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));\n'+
        'float SinTheta = sqrt(1.0 - CosTheta * CosTheta);\n'+

        'vec3 H;\n'+
        'H.x = SinTheta * cos(Phi);\n'+
        'H.y = SinTheta * sin(Phi);\n'+
        'H.z = CosTheta;\n'+

        'vec3 UpVector = abs(N.z) < 0.999 ? vec3(0.0,0.0,1.0) : vec3(1.0,0.0,0.0);\n'+
        'vec3 TangentX = normalize(cross(UpVector, N));\n'+
        'vec3 TangentY = cross(N, TangentX);\n'+

        'return TangentX * H.x + TangentY * H.y + N * H.z;\n'+
    '}\n';

    return shaderPart;
};

/**
 * @return {string}
 */
x3dom.shader.pbr.NormalMapFunctions = function()
{
    var shaderPart =
        'mat3 cotangent_frame(vec3 N, vec3 p, vec2 uv)\n'+
        '{\n'+
            // get edge vectors of the pixel triangle
            'vec3 dp1 = dFdx( p );\n'+
            'vec3 dp2 = dFdy( p );\n'+
            'vec2 duv1 = dFdx( uv );\n'+
            'vec2 duv2 = dFdy( uv );\n'+

            // solve the linear system +
            'vec3 dp2perp = cross( dp2, N );\n'+
            'vec3 dp1perp = cross( N, dp1 );\n'+
            'vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;\n'+
            'vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;\n'+

            // construct a scale-invariant frame
            'float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );\n'+
            'return mat3( T * invmax, B * invmax, N );\n'+
        '}\n'+

        'vec3 perturb_normal( vec3 N, vec3 V, vec2 texcoord )\n'+
        '{\n'+
            // assume N, the interpolated vertex normal and
            // V, the view vector (vertex to eye)
            'vec3 map = texture2D(normalTex, texcoord ).xyz;\n'+
            'map = 2.0 * map - 1.0;\n'+
            'mat3 TBN = cotangent_frame(N, -V, texcoord);\n'+
            'return normalize(TBN * map);\n'+
        '}';

    return shaderPart;
};

/**
 * @return {string}
 */
x3dom.shader.pbr.PreCalcIntegrateBRDF = function()
{
    var shaderPart =
        'vec2 IntegrateBRDF(float Roughness, float NoV)\n'+
        '{\n'+
            'vec3 V;\n'+
            'V.x = sqrt(1.0 - NoV * NoV);\n'+
            'V.y = 0.0;\n'+
            'V.z = NoV;\n'+

            'vec3 N = vec3(0.0,0.0,1.0);\n'+

            'float A = 0.0;\n'+
            'float B = 0.0;\n'+

            //const int NumSamples = 1024;
            'for(int i = 0; i< NumSamples; ++i)\n'+
            '{\n'+
                'vec2 Xi = random(i, NumSamples);\n'+
                'vec3 H = ImportanceSampleGGX(Xi, Roughness, N);\n'+
                'vec3 L = 2.0 * dot(V,H) * H - V;\n'+

                'float NoL = saturate(L.z);\n'+
                'float NoH = saturate(H.z);\n'+
                'float VoH = saturate(dot(V,H));\n'+

                'if(NoL > 0.0)\n'+
                '{\n'+
                    'float G = G_Smith(Roughness, NoV, NoL);\n'+

                    'float G_Vis = G * VoH / (NoH * NoV);\n'+
                    'float Fc = pow(1.0 - VoH, 5.0);\n'+
                    'A += (1.0-Fc) * G_Vis;\n'+
                    'B += Fc * G_Vis;\n'+
                '}\n'+
            '}\n'+

            'return vec2(A,B) / float(NumSamples);\n'+
        '}\n';

    return shaderPart;
};

/**
 * @return {string}
 */
x3dom.shader.pbr.PreCalcPrefilterEnvMap = function()
{
    var shaderPart =
        'vec3 PrefilterEnvMap(float Roughness, vec3 R)\n'+
        '{\n'+
            'vec3 N = R;\n'+
            'vec3 V = R;\n'+

           ' vec3 PrefilteredColor = vec3(0.0);\n'+

            'float TotalWeight = 0.0000001;\n'+
            'for(int i = 0; i< NumSamples; ++i)\n'+
            '{\n'+
                'vec2 Xi = random(i, NumSamples); //Hammersley2D\n'+
                'vec3 H = ImportanceSampleGGX(Xi, Roughness, N);\n'+
                'vec3 L = 2.0 * dot(V,H) * H - V;\n'+

                'float NoL = saturate(dot(N,L));\n'+

                'if(NoL > 0.0)\n'+
                '{\n'+
                    'PrefilteredColor += textureCube(envTex, L).rgb * NoL;\n'+
                    'TotalWeight += NoL;\n'+
                '}\n'+

            '}\n'+

            'return PrefilteredColor / TotalWeight;\n'+
        '}\n';

    return shaderPart;
};

x3dom.shader.PBRPrefilterEnvShader = function(gl, properties)
{
    this.program = gl.createProgram();

    var vertexShader 	= this.generateVertexShader(gl, properties);
    var fragmentShader 	= this.generateFragmentShader(gl, properties);

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);

    // optional, but position should be at location 0 for performance reasons
    gl.bindAttribLocation(this.program, 0, "position");

    gl.linkProgram(this.program);

    return this.program;
};

x3dom.shader.PBRPrefilterEnvShader.prototype.generateVertexShader = function(gl, properties)
{
    var shader = x3dom.shader.pbr.RenderFullscreenVertexShader();

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, shader);
    gl.compileShader(vertexShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        x3dom.debug.logError("[NormalShader] VertexShader " + gl.getShaderInfoLog(vertexShader));
    }

    return vertexShader;
};


x3dom.shader.PBRPrefilterEnvShader.prototype.generateFragmentShader = function(gl, properties)
{
    var shader =
        'precision mediump float;\n'+
        'uniform samplerCube envTex;\n'+
        'uniform int face;\n'+
        'uniform float roughness;\n'+
        'varying vec3 v_texCoord;\n'+
        '#define M_PI 3.1415926535897932384626433832795\n';

    shader += '#define NumSamples 1024\n';

    shader += x3dom.shader.pbr.PreCalcFragFunctions();
    shader += x3dom.shader.pbr.PreCalcPrefilterEnvMap();

    shader+=
        'vec3 GetCubeDirFromUVFace(int face, vec2 uv)\n'+
        '{' +
            'vec2 debiased = uv * 2.0 - 1.0;\n'+
    
            'vec3 dir = vec3(0.0);\n'+
    
            'if(face == 0)\n'+
                'dir = vec3(1.0, -debiased.y, -debiased.x);\n'+
            'else if(face == 1)\n'+
                'dir = vec3(-1.0, -debiased.y, debiased.x);\n'+
            'else if(face == 2)\n'+
                'dir = vec3(debiased.x, 1.0, debiased.y);\n'+
            'else if(face == 3)\n'+
                'dir = vec3(debiased.x, -1.0, -debiased.y);\n'+
            'else if(face == 4)\n'+
                'dir = vec3(debiased.x, -debiased.y, 1.0);\n'+
            'else if(face == 5)\n'+
                'dir = vec3(-debiased.x, -debiased.y, -1.0);\n'+
    
            'return dir;\n'+
        '}\n'+
        'void main()\n'+
        '{\n'+
            'vec3 cubeDir = normalize(GetCubeDirFromUVFace(0, vec2(1.0-v_texCoord.x, v_texCoord.y)));\n'+
            'gl_FragColor = vec4(PrefilterEnvMap(roughness, cubeDir),1.0);\n'+
        '}\n';

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, shader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        x3dom.debug.logError("[NormalShader] FragmentShader " + gl.getShaderInfoLog(fragmentShader));
    }

    return fragmentShader;
};

x3dom.shader.PBRCalcBRDFShader = function(gl, properties)
{
    this.program = gl.createProgram();

    var vertexShader 	= this.generateVertexShader(gl, properties);
    var fragmentShader 	= this.generateFragmentShader(gl, properties);

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);

    // optional, but position should be at location 0 for performance reasons
    gl.bindAttribLocation(this.program, 0, "position");

    gl.linkProgram(this.program);

    return this.program;
};

x3dom.shader.PBRCalcBRDFShader.prototype.generateVertexShader = function(gl, properties)
{
    var shader = x3dom.shader.pbr.RenderFullscreenVertexShader();

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, shader);
    gl.compileShader(vertexShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        x3dom.debug.logError("[NormalShader] VertexShader " + gl.getShaderInfoLog(vertexShader));
    }

    return vertexShader;
};


x3dom.shader.PBRCalcBRDFShader.prototype.generateFragmentShader = function(gl, properties)
{
    var shader =
        'precision mediump float;\n'+
        'uniform float roughness;\n'+
        'varying vec3 v_texCoord;\n'+
        '#define M_PI 3.1415926535897932384626433832795\n';

    shader += '#define NumSamples 1024\n';

    shader += x3dom.shader.pbr.PreCalcFragFunctions();
    shader += x3dom.shader.pbr.PreCalcIntegrateBRDF();

    shader+=
        'void main()\n'+
        '{\n'+
        'vec2 brdf = IntegrateBRDF(v_texCoord.x,v_texCoord.y);\n'+
        'gl_FragColor = vec4(brdf, 0.0,1.0);\n'+
        '}\n';

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, shader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        x3dom.debug.logError("[NormalShader] FragmentShader " + gl.getShaderInfoLog(fragmentShader));
    }

    return fragmentShader;
};

x3dom.shader.PBRShader = function(gl, properties)
{
    this.program = gl.createProgram();

    var vertexShader 	= this.generateVertexShader(gl, properties);
    var fragmentShader 	= this.generateFragmentShader(gl, properties);

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);

    // optional, but position should be at location 0 for performance reasons
    gl.bindAttribLocation(this.program, 0, "position");

    gl.linkProgram(this.program);

    return this.program;
};

x3dom.shader.PBRShader.prototype.generateVertexShader = function(gl, properties)
{
    var shader = x3dom.shader.pbr.RenderPBRVertexShader();

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, shader);
    gl.compileShader(vertexShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        x3dom.debug.logError("[NormalShader] VertexShader " + gl.getShaderInfoLog(vertexShader));
    }

    return vertexShader;
};


x3dom.shader.PBRShader.prototype.generateFragmentShader = function(gl, properties)
{
    var shader =
        'void main()'+
        '{'+
            'vec2 texcoord = vec2(v_texCoord.x,-v_texCoord.y);'+

            'float roughness = texture2D(roughnessTex, texcoord).x;'+
            'float metalness = texture2D(metallicTex, texcoord).x;'+
            'vec3 baseColor = texture2D(diffuseTex, texcoord).xyz;'+

            'vec3 normal = perturb_normal(v_normal, v_eyeVector, texcoord);'+

            'vec3 N = normalize(normal);'+
            'vec3 V = normalize(-v_eyeVector);'+

            'float NoV = saturate(dot(N,V));'+

            'vec3 F0 = mix(vec3(0.04), baseColor, metalness);'+
            'vec3 Fc = fresnel_factor(F0, NoV);'+

            'vec3 cdiff = baseColor * (1.0 - Fc);'+

            'vec3 R =  reflect(-V,N);'+

            'vec3 EnvDiff = PrefilterEnvMap(1.0, R);'+
            'vec3 EnvSpec = PrefilterEnvMap(roughness, R);'+
            'vec2 EnvBRDF = IntegrateBRDF(roughness, NoV);'+

            'vec3 specular =  EnvSpec * (F0 * EnvBRDF.x + EnvBRDF.y);'+
            'vec3 diff = EnvDiff * mix(cdiff, vec3(0.0), F0);'+

            'vec3 color = diff + specular;'+

            'gl_FragColor = vec4(color, 1.0);'+
        '}';

    shader =  document.getElementById("pbrFragShader").textContent;

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, shader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        x3dom.debug.logError("[NormalShader] FragmentShader " + gl.getShaderInfoLog(fragmentShader));
    }

    return fragmentShader;
};

x3dom.shader.pbr.util.renderToTexture = function(gl, shader, outTexture, textureType, width, height)
{
    var vertices = [
        -1, -1, 0,
        1, -1, 0,
        1,  1, 0,
        -1,  1, 0
    ];

    var texCoords = [
        1, 0,
        0, 0,
        0, 1,
        1, 1
    ];

    var indices = [1,2,3,0,1,3];

    var vertex_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var texcoord_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var index_Buffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    framebuffer.width = width;
    framebuffer.height = height;

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, textureType, outTexture, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var coord = gl.getAttribLocation(shader, "position");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
    var texcoord = gl.getAttribLocation(shader, "texcoord");
    gl.vertexAttribPointer(texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoord);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, width, height);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

x3dom.shader.pbr.util.renderBRFDToTexture = function(gl)
{
    if(x3dom.shader.pbr.util.texture != null)
    {
        //x3dom.shader.pbr.util.DebugRenderTexturedQuad(gl, x3dom.shader.pbr.util.texture, gl.TEXTURE_2D);
        return x3dom.shader.pbr.util.texture;
    }

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var shader = new x3dom.shader.PBRCalcBRDFShader(gl);
    gl.useProgram(shader);

    x3dom.shader.pbr.util.renderToTexture(gl, shader, texture, gl.TEXTURE_2D, 512, 512);
    x3dom.shader.pbr.util.texture = texture;

    return texture;
};

x3dom.shader.pbr.util.createPrefilteredEnvMipmaps = function(gl, cubeMap, width, height, levels)
{
    if(x3dom.shader.pbr.util.mipmaps != null)
    {
        //x3dom.shader.pbr.util.DebugRenderTexturedCubeToQuad(gl,x3dom.shader.pbr.util.mipmaps[1]);
        return x3dom.shader.pbr.util.mipmaps;
    }

    var shader = new x3dom.shader.PBRPrefilterEnvShader(gl);
    gl.useProgram(shader);
    gl.uniform1i(gl.getUniformLocation(shader, "envTex"), 0);

    var mipmaps = [cubeMap];

    for(var l = 1; l<levels;++l)
    {
        var mipWidth = width / Math.pow(2, l);
        var mipHeight= height / Math.pow(2, l);

        console.log(mipWidth);

        var roughnessLevel = 1.0 / levels;
        gl.uniform1f(gl.getUniformLocation(shader, "roughness"), roughnessLevel * l);

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        for(var i = 0; i<6;++i)
        {
            gl.uniform1f(gl.getUniformLocation(shader, "face"), i);

            var textureType = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            gl.texImage2D(textureType, 0, gl.RGBA, mipWidth, mipHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        for(i = 0; i<6;++i)
        {
            var textureType = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            x3dom.shader.pbr.util.renderToTexture(gl, shader, texture, textureType, mipWidth, mipHeight);
        }

        mipmaps.push(texture);
    }

    x3dom.shader.pbr.util.mipmaps = mipmaps;

    return mipmaps;
};

x3dom.shader.pbr.util.DebugRenderTexturedQuad = function(gl, texture)
{
    if(x3dom.shader.pbr.util.debug == null) {

        var vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0
        ];

        indices = [1, 2, 3, 0, 1, 3];

        var texCoords = [
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ];

        var vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        var index_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        var texcoord_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        /*====================== Shaders =======================*/

        // Vertex shader source code
        var vertCode =
            'precision mediump float;\n' +
            'attribute vec3 position;' +
            'attribute vec3 texcoord;' +
            'varying vec3 v_texcoord;' +
            'void main(void) {' +
            ' gl_Position = vec4(position, 1.0);' +
            ' v_texcoord = texcoord;' +
            '}';

        // Create a vertex shader object
        var vertShader = gl.createShader(gl.VERTEX_SHADER);

        // Attach vertex shader source code
        gl.shaderSource(vertShader, vertCode);

        // Compile the vertex shader
        gl.compileShader(vertShader);

        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            x3dom.debug.logError("[NormalShader] VertShader " + gl.getShaderInfoLog(vertShader));
        }

        // Fragment shader source code
        var fragCode =
            'precision mediump float;\n' +
            'uniform sampler2D tex;' +
            'varying vec3 v_texcoord;' +
            'void main(void) {' +
            ' gl_FragColor = vec4(texture2D(tex, v_texcoord.xy).xyz, 1.0);' +
            '}';

        // Create fragment shader object
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        // Attach fragment shader source code
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            x3dom.debug.logError("[NormalShader] FragShader " + gl.getShaderInfoLog(fragShader));
        }

        // Create a shader program object to
        // store the combined shader program
        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);

        gl.linkProgram(shaderProgram);


        x3dom.shader.pbr.util.debug = {};
        x3dom.shader.pbr.util.debug.shader = shaderProgram;
        x3dom.shader.pbr.util.debug.vertex_buffer = vertex_buffer;
        x3dom.shader.pbr.util.debug.texcoord_buffer = texcoord_buffer;
        x3dom.shader.pbr.util.debug.index_buffer = index_Buffer;
    }

    var shaderProgram = x3dom.shader.pbr.util.debug.shader;
    var vertex_buffer = x3dom.shader.pbr.util.debug.vertex_buffer;
    var texcoord_buffer = x3dom.shader.pbr.util.debug.texcoord_buffer;
    var index_Buffer = x3dom.shader.pbr.util.debug.index_buffer;

    gl.useProgram(shaderProgram);

    /* ======= Associating shaders to buffer objects =======*/

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "tex"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var coord = gl.getAttribLocation(shaderProgram, "position");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
    var texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
    gl.vertexAttribPointer(texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    /*============= Drawing the Quad ================*/

    gl.clearColor(0.5, 0.5, 0.5, 0.9);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

    // Draw the triangle
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);

    gl.useProgram(null);
};

x3dom.shader.pbr.util.DebugRenderTexturedCubeToQuad = function(gl, cubeTexture)
{
    if(x3dom.shader.pbr.util.debug == null) {

        var vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0
        ];

        indices = [1, 2, 3, 0, 1, 3];

        var texCoords = [
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ];

        var vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        var index_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        var texcoord_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        /*====================== Shaders =======================*/

        // Vertex shader source code
        var vertCode =
            'precision mediump float;\n' +
            'attribute vec3 position;' +
            'attribute vec3 texcoord;' +
            'varying vec3 v_texcoord;' +
            'void main(void) {' +
            ' gl_Position = vec4(position, 1.0);' +
            ' v_texcoord = texcoord;' +
            '}';

        // Create a vertex shader object
        var vertShader = gl.createShader(gl.VERTEX_SHADER);

        // Attach vertex shader source code
        gl.shaderSource(vertShader, vertCode);

        // Compile the vertex shader
        gl.compileShader(vertShader);

        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            x3dom.debug.logError("[NormalShader] VertShader " + gl.getShaderInfoLog(vertShader));
        }

        // Fragment shader source code
        var fragCode =
            'precision mediump float;\n' +
            'uniform samplerCube tex;' +
            'varying vec3 v_texcoord;' +
            'void main(void) {' +
            'vec2 debiased = v_texcoord.xy * 2.0 - 1.0;\n'+
            ' gl_FragColor = vec4(textureCube(tex, vec3(1, -debiased.x, debiased.y)).xyz, 1.0);' +
            '}';

        // Create fragment shader object
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        // Attach fragment shader source code
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            x3dom.debug.logError("[NormalShader] FragShader " + gl.getShaderInfoLog(fragShader));
        }

        // Create a shader program object to
        // store the combined shader program
        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);

        gl.linkProgram(shaderProgram);


        x3dom.shader.pbr.util.debug = {};
        x3dom.shader.pbr.util.debug.shader = shaderProgram;
        x3dom.shader.pbr.util.debug.vertex_buffer = vertex_buffer;
        x3dom.shader.pbr.util.debug.texcoord_buffer = texcoord_buffer;
        x3dom.shader.pbr.util.debug.index_buffer = index_Buffer;
    }

    var shaderProgram = x3dom.shader.pbr.util.debug.shader;
    var vertex_buffer = x3dom.shader.pbr.util.debug.vertex_buffer;
    var texcoord_buffer = x3dom.shader.pbr.util.debug.texcoord_buffer;
    var index_Buffer = x3dom.shader.pbr.util.debug.index_buffer;

    gl.useProgram(shaderProgram);

    /* ======= Associating shaders to buffer objects =======*/

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "tex"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var coord = gl.getAttribLocation(shaderProgram, "position");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
    var texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
    gl.vertexAttribPointer(texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    /*============= Drawing the Quad ================*/

    gl.clearColor(0.5, 0.5, 0.5, 0.9);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

    // Draw the triangle
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);

    gl.useProgram(null);
};