//David Ciupei
//CS442 Project#1

process.stdin.setEncoding('utf8');

var inputChunks = [];


process.stdin.on('data', function(chunk) {

    inputChunks.push(chunk);

});

var Polygon = function(verts){
    this.verts = verts;
};

//function Polygon(verts) {
//    this.verts = verts.splice();  // clone
//}


Polygon.prototype.triangulate = function(){
    var V = this.verts.length;
    if(V < 3) {return;}   //no triangles so returns

    var Area = 0;

    //Computing area A of input polygon using Equation 3.
    for (var i= 0; i < V; i++) {
        var X1 = this.verts[(i+1) % V].x;
        var X = this.verts[i].x;
        var Y1 = this.verts[(i+1) % V].y;
        var Y = this.verts[i].y;
        Area +=  ((X * Y1) - (X1 * Y));
    }

    Area = .5 * Area;

    var Index = [];    //Build index array I = {0, 1, . . . , |V | − 1}.
    for(var i = 0; i < V; i++){
        Index[i] = i;
    }

    var triangles = []; //Let array triangles (initially empty) hold triangle indices.
    var temp = [];      //temp array
    while (Index.length > 3){
        var a = 0.0;
        var n = 0;
        for(var i = 0; i < Index.length; i++) {
            var Ai = 0;
            temp = [];

            var V_max = Index[(i + 1) % Index.length];
            var V_min = Index[(i - 1 + Index.length) % Index.length];

            //V_(i-1) of Index array
            var minus = this.verts[V_min];

            //V_(i) of Index array
            var regular = this.verts[Index[i]];

            //V_(i+1) of Index array
            var plus = this.verts[V_max];

            temp.push(minus, regular, plus);    //push the indicies onto the temp array

            for (var r = 0; r < temp.length; r++) {
                var X_ = temp[r].x;
                var X_1 = temp[(r + 1) % temp.length].x;
                var Y_ = temp[r].y;
                var Y_1 = temp[(r + 1) % temp.length].y;
                Ai += (X_ * Y_1) - (X_1 * Y_);
            }

            Ai = Ai * .5;
            //console.log(Ai);

            if ((Math.abs(Ai) > a) && ((Ai * Area) > 0)) {  //if |Ai| > a and Ai · A > 0
                var ear = true;

                //determines if point P lies inside the triangle
                for (var j = 0; j < Index.length; j++) {
                    if((Index[j] !== V_min) && Index[j] !== Index[i] && Index[j] !== V_max && ear){

                        var first = true;
                        var d = 0;
                        for (var k = 0; k < 3; k++) {

                            //u = v_i+1 − v_i
                            var Ux = temp[(k + 1) % 3].x - temp[k].x;
                            var Uy = temp[(k + 1) % 3].y - temp[k].y;

                            //w = P − v_i
                            var P = this.verts[Index[j]];
                            var Wx = P.x - temp[k].x;
                            var Wy = P.y - temp[k].y;

                            //Let z = u_x · w_y − u_y · w_x
                            var z = (Ux * Wy) - (Uy * Wx);


                            if (z !== 0) {
                                if (first) {
                                    d = z;
                                    first = false;
                                } else if ((z * d) < 0) {
                                    ear = true;
                                    break;
                                }
                            }
                            ear = false;
                        }
                    }
                }
                if (ear) {
                    n = i;
                    a = Math.abs(Ai);
                }
            }
        }
        var n_plus1 = (n + 1) % Index.length;
        var n_minus1 = (n - 1 + Index.length) % Index.length;
        triangles.push(Index[n_minus1], Index[n], Index[n_plus1]);
        Index.splice(n, 1);
    }

    triangles.push(Index[0], Index[1], Index[2]);

    return triangles;

};

process.stdin.on('end', function() {
    var inputJSON = inputChunks.join();
    var verts = JSON.parse(inputJSON);
    var poly = new Polygon(verts);
    var triangles = poly.triangulate();
    var result = {verts: verts, triangles: triangles};
    process.stdout.write(JSON.stringify(result, null, 4) + '\n');
});
