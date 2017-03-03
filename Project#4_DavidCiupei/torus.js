//David Ciupei
//Project #3 CS442

var torus = {

    N : null,
    M : null,

    verts : null,
    normals : null,
    texCoords : null,

    createGeometry : function() {
        var N = this.N, M = this.M;
        var numFloats = 3 * (N + 1) * (M + 1);
        var dv = 2 * (Math.PI / 2) / N;
        var du = 2 * Math.PI / M;
        if (!this.verts || this.verts.length != numFloats) {
            this.verts = new Float32Array(numFloats);
            this.normals = new Float32Array(numFloats);
            this.texCoords = new Float32Array(2 * (N + 1) * (M + 1));
            this.distance = new Float32Array(M+1);
            this.distance1 = new Float32Array(N+1);
        }

        var n = 3;
        var m = 4;

        var x = 0;
        var v = -Math.PI / 2;
        for (var i = 0; i < N + 1; i++, v+=dv) {
            var u = -Math.PI;
            for (var j = 0; j < M + 1; j++, u+=du) {
                this.verts[x] = (Math.cos(v) * Math.pow(Math.abs(Math.cos(v)), 2/m-1) * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 2/n-1));
                this.verts[x+1] = (Math.cos(v) * Math.pow(Math.abs(Math.cos(v)), 2/m-1) * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 2/n-1));
                this.verts[x+2] = (Math.sin(v) * Math.pow(Math.abs(Math.sin(v)), 2/m-1));
                this.normals[x] = (Math.cos(v) * Math.pow(Math.abs(Math.cos(v)), 1-2/m)*Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 1-2/n));
                this.normals[x+1] = (Math.cos(v) * Math.pow(Math.abs(Math.cos(v)), 1-2/m)*Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 1-2/n));
                this.normals[x+2] = (Math.sin(v) * Math.pow(Math.abs(Math.sin(v)), 1-2/m));
                x += 3;

            }
        }

        //calculating S_ij
        var m = 2 * (M+1) + 2;
        for (var i = 1; i < N; i++) {
            var distance_sum = 0;
            for (var j = 1; j <= M; j++) {
                var x = ((M + 1) * i + j - 1) * 3;
                var y = ((M + 1) * i + j) * 3;
                var x_1 = this.verts[x];
                var x_2 = this.verts[y];
                var x_Total = x_1 - x_2;
                var y_1 = this.verts[x + 1];
                var y_2 = this.verts[y + 1];
                var y_Total = y_1 - y_2;
                var z_1 = this.verts[x + 2];
                var z_2 = this.verts[y + 2];
                var z_Total = z_1 - z_2;
                this.distance[j] += Math.sqrt(Math.pow(x_Total, 2) + Math.pow(y_Total, 2) + Math.pow(z_Total, 2));
                distance_sum += this.distance[j];
            }

            //finding the partial sum and dividing it by the distance sum
            for (var x = 1; x <= M; x++) {
                var partial_sum = 0;
                for (var y = 0; y <= x; y++) {
                    partial_sum += this.distance[y];
                }

                this.texCoords[m] = partial_sum / distance_sum;  //adding it to texCoords
                m += 2;
            }
            m += 2;
        }

        //calculating T_ij
        for (var j = 0; j < M; j++){
            var distance_sum = 0;
            for (var i = 1; i <= N; i++){
                var x = ((M + 1) * (i - 1) + j) * 3;
                var y = ((M + 1) * i + j) * 3;
                var x_1 = this.verts[x];
                var x_2 = this.verts[y];
                var x_Total = x_1 - x_2;
                var y_1 = this.verts[x + 1];
                var y_2 = this.verts[y + 1];
                var y_Total = y_1 - y_2;
                var z_1 = this.verts[x + 2];
                var z_2 = this.verts[y + 2];
                var z_Total = z_1 - z_2;
                this.distance1[i] += Math.sqrt(Math.pow(x_Total, 2) + Math.pow(y_Total, 2) + Math.pow(z_Total, 2));
                distance_sum += this.distance1[i];

            }

            //finding the partial sum and dividing it by the distance sum
            for (var x = 0; x <= N; x++){
                var partial_sum = 0;
                for (var y = 0; y <= x; y++){
                    partial_sum += this.distance1[y];
                }
                this.texCoords[x * 2 * (M+1) + (2 * j) + 1] = partial_sum/distance_sum;  //adding it to texCoords
            }
        }

        for (var i = 0; i <= M; i++){
            this.texCoords[i * 2] = this.texCoords[(2 * (M+1)) + (2 * i)];
            this.texCoords[N * 2 * (M+1) + (2 * i)] = this.texCoords[(N-1) * (2 * (M+1)) + (2 * i)];
            this.texCoords[(i * 2 * (M+1)) + (2 * M) + 1] = this.texCoords[i * 2 * (M+1) + 1];

        }

    },

            triangleStrip: null,

        createTriangleStrip : function() {
            var M = this.M, N = this.N;
            var numIndices = N*(2*(M+1)+2)-2;          //changed this line from the original
            if (!this.triangleStrip || this.triangleStrip.length != numIndices)
                this.triangleStrip = new Uint16Array(numIndices);
            var index = function(i, j) {
                return i*(M+1) + j;
            }
            var n = 0;
            for (var i = 0; i < N; i++) {
                if (i > 0)  // degenerate connecting index
                    this.triangleStrip[n++] = index(i,0);
                for (var j = 0; j <= M; j++) {
                    this.triangleStrip[n++] = index(i+1,j);
                    this.triangleStrip[n++] = index(i,j);
                }
                if (i < N-1) // degenerate connecting index
                    this.triangleStrip[n++] = index(i,M)
            }

    },

    wireframe : null, // Uint16Array  (line indices)


    createWireFrame : function() {
    var lines = [];
    lines.push(this.triangleStrip[0], this.triangleStrip[1]);
    var numStripIndices = this.triangleStrip.length;
    for (var i = 2; i < numStripIndices; i++) {
        var a = this.triangleStrip[i-2];
        var b = this.triangleStrip[i-1];
        var c = this.triangleStrip[i];
        if (a != b && b != c && c != a)
            lines.push(a, c, b, c);
    }
    this.wireframe = new Uint16Array(lines);
},

numHedgeHogElements : 0,
    hedgeHog : null,  // Float32Array of lines

    createHedgeHog : function() {
    var lines = [];
    var hedgeHogLength = 0.8*this.r;
    var numNormals = this.normals.length;
    for (var i = 0; i < numNormals; i += 3) {
        var p = [this.verts[i], this.verts[i+1], this.verts[i+2]];
        var n = [this.normals[i], this.normals[i+1], this.normals[i+2]];
        var q = [p[0] + hedgeHogLength*n[0],
            p[1] + hedgeHogLength*n[1],
            p[2] + hedgeHogLength*n[2]];
        lines.push(p[0], p[1], p[2],
            q[0], q[1], q[2]);
    }
    this.numHedgeHogElements = lines.length/3;
    this.hedgeHog = new Float32Array(lines);
}

};