//
// Non-wildcard version of smatch.
//
function smatch1(pattern, target) {
    if (typeof pattern === "number" || typeof pattern == "string")
        return pattern === target;          // same number or string
    else
        return pattern instanceof Array &&  // pattern and
               target instanceof Array &&   // target are arrays
               pattern.length === target.length &&    // of the same length
               pattern.every(function(elem, index) {  // and recursively
                   return smatch1(elem, target[index]); // contain same elems
               });
}

function smatch(pattern, target, table) {
    table = table || {}
    if(pattern === target){
        return table;
    }
    else if(typeof pattern === "string"){
        if(pattern.substr(-1) === '?'){
            qMark = pattern.substring(0, pattern.length - 1);
            table[qMark] = target;
            return table;
        }
    }
    else
        if(! (pattern instanceof Array &&  // pattern and
               target instanceof Array &&   // target are arrays
               pattern.length === target.length &&    // of the same length
               pattern.every(function(elem, index) {  // and recursively
                   return smatch(elem, target[index], table); // contain same elems
               })))
            return null;
        else return table;

    }

var diffPowerRule = {
    pattern : function(target, table) {
        return smatch(['DERIV', ['^', 'E?', 'N?'], 'V?'], target, table) &&
            typeof table.N === "number";
    },
    transform: function(table) {
        return ['*', ['*', table.N, ['^', table.E, table.N - 1]], 
                ['DERIV', table.E, table.V]];
    },
    label: "diffPowerRule"
};

//
//  d/dt t = 1
//
var diffXRule = {
    pattern : function(target, table) {
        return smatch(['DERIV', 'E?', 'V?'], target, table) &&
            table.E === table.V;
    },
    transform: function(table) {
        return 1;
    },
    label: "diffXRule"
};

//
// (u + v)' = u' + v'
//
var diffSumRule = {
    pattern: function(target, table) {
        return smatch(['DERIV', ['+', 'E1?', 'E2?'],'V?'], target, table);
    },
    transform: function(table) {
        return ['+', ['DERIV', table.E1, table.V], ['DERIV', table.E2, table.V]];
    },
    label: "diffSumRule"
};

//
// (u - v)' = u' - v'
//
var diffSubtractRule = {
    pattern: function(target, table) {
        return smatch(['DERIV', ['-', 'E1?', 'E2?'],'V?'], target, table);
    },
    transform: function(table) {
        return ['-', ['DERIV', table.E1, table.V], ['DERIV', table.E2, table.V]];
    },
    label: "diffSubtractRule"
};

//
// d/dt C = 0   (C does not depend on t)
//
var diffConstRule = {
    pattern: function(target, table) {
        return smatch(['DERIV', 'E?', 'V?'], target, table);

    },
    transform: function(table) {
        for (var i = 0; i < table.E.length; i++) {
            if(table.E[i] === table.V){
                return null;
            }
        }
        return 0;
    },
    label: "diffConstRule"
};

//
// (u v)' = uv' + vu'
//
var diffProductRule = {
    pattern: function(target, table) {
        return smatch(['DERIV', ['*', 'E1?', 'E2?'],'V?'], target, table);
        
    },
    transform: function(table) {
        return ['+', ['*' ,table.E1, ['DERIV', table.E2, table.V]],
                 ['*' ,table.E2, ['DERIV', table.E1, table.V]]];
    },
    label: "diffProductRule"
};

//
// 3 + 4 = 7   (evaluate constant binary expressions)
//
var foldBinopRule = {
    pattern: function(target, table) {
        return smatch(['OP?', 'A?', 'B?'], target, table) &&
            typeof table.OP !== "number" && typeof table.A === "number" && typeof table.B === "number";
    },
    transform: function(table) { 
        if(table.OP === '+')
        {
            x = table.A + table.B;
            return x;
        }
        if(table.OP === '-')
        {
            x = table.A - table.B;
            return x;
        }
        
        if(table.OP === '*')
        {
            x = table.A * table.B;
            return x;
        }
        if(table.OP === '/')
        {
            x = table.A / table.B;
            return x;
        }
        if(table.OP === '^')
        {
            x = Math.pow(table.A, table.B)
            return x;
        }
    },
    label: "foldBinopRule"
};

//
// 3*(2*E) = 6*E  : [*, a, [*, b, e]] => [*, (a*b), e]
//
var foldCoeff1Rule = {
    pattern: function(target, table) {
        return smatch(['*', 'A?', ['*', 'B?', 'E?']], target, table) 
            && typeof table.A === "number" && typeof table.B === "number";
    },
    transform: function(table) {
        return ['*', (table.A * table.B), table.E];
    },
    label: "foldCoeff1Rule"
};

//
//  x^0 = 1
//
var expt0Rule = {
    pattern: function(target, table) {
        return smatch(['^', 'E?', 0], target, table)
    },
    transform: function(table) {
        return 1;
    },
    label: "expt0Rule"
};

//
//  x^1 = x
//
var expt1Rule = {
    pattern: function(target, table) {
        return smatch(['^', 'E?', 1], target, table)
    },
    transform: function(table) {
        return table.E;
    },
    label: "expt1Rule"
};
//
//  E * 1 = 1 * E = 0 + E = E + 0 = E
//
var unityRule = {
    pattern: function(target, table) {
        if(smatch(['*', 'E?', 1], target, table)){
            return smatch(['*', 'E?', 1], target, table);
        }
        if(smatch(['*', 1, 'E?'], target, table)){
            return smatch(['*', 1, 'E?'], target, table);
        }
        if(smatch(['+', 0, 'E?'], target, table)){
            return smatch(['+', 0, 'E?'], target, table);
        }else{
            return smatch(['+', 'E?', 0], target, table);
        }    
    },
    transform: function(table) {
        return table.E;
    },
    label: "unityRule"
};

//
// E * 0 = 0 * E = 0
//
var times0Rule = {
    pattern: function(target, table) {
        if(smatch(['*', 'E?', 0], target, table)){
            return smatch(['*', 'E?', 0], target, table);
        }else{
            return smatch(['*', 0, 'E?'], target, table);
        }
    },
    transform: function(table) {
        return 0;
    },
    label: "time0Rule"
};

//
// Try to apply "rule" to "expr" recursively -- rule may fire multiple times
// on subexpressions.
// Returns null if rule is *never* applied, else new transformed expression.
// 
function tryRule(rule, expr) {
    var table = {}
    if (!(expr instanceof Array))  // rule patterns match only arrays
        return null;
    else if (rule.pattern(expr, table)) { // rule matches whole expres
        console.log("rule " + rule.label + " fires.");
        return rule.transform(table);     // return transformed expression
    } else { // let's recursively try the rule on each subexpression
        var anyFire = false;
        var newExpr = expr.map(function(e) {
            var t = tryRule(rule, e);
            if (t !== null) {     // note : t = 0 is a valid expression
                anyFire = true;   // at least one rule fired
                return t;         // return transformed subexpression
            } else {
                return e;         // return original subexpression
            }
        });
        return anyFire ? newExpr : null;
    }
}

//
// Try transforming the given expression using all the rules.
// If any rules fire, we return the new transformed expression;
// Otherwise, null is returned.
//
function tryAllRules(expr) {
    var rules = [
        diffPowerRule,
        diffXRule,
        diffSumRule,
        diffConstRule,
        diffProductRule,
        diffSubtractRule,
        expt0Rule,
        expt1Rule,
        unityRule,
        times0Rule,
        foldBinopRule,
        foldCoeff1Rule
    ];
    
    for(var i = 0; i < rules.length; i++) {
        if(tryRule(rules[i], expr) !== null){
            return tryRule(rules[i], expr);
        }
    }
    return null;
}

//
// Repeatedly try to reduce expression by applying rules.
// As soon as no more rules fire we are done.
//
function reduceExpr(expr) {
    var e = tryAllRules(expr);
    return (e != null) ? reduceExpr(e) : expr;
}

//if (diffPowerRule.pattern(['DERIV', ['^', 'X', 3], 'X'], table)) {
//     var f = diffPowerRule.transform(table);
//     console.log(f);
// }

//
// Node module exports.
//
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    exports.smatch = smatch;
    exports.diffPowerRule = diffPowerRule;
    exports.tryRule = tryRule;

    exports.diffXRule = diffXRule;
    exports.diffSumRule = diffSumRule;
    exports.diffConstRule = diffConstRule;
    exports.diffProductRule = diffProductRule;
    exports.foldBinopRule = foldBinopRule;
    exports.foldCoeff1Rule = foldCoeff1Rule;
    exports.expt0Rule = expt0Rule;
    exports.expt1Rule = expt1Rule;
    exports.unityRule = unityRule;
    exports.times0Rule = times0Rule;

    exports.tryAllRules = tryAllRules;
    exports.reduceExpr = reduceExpr;
}
