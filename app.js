window.onload = function() {
    var elm = document.getElementById('queryInput');
    elm.oninput = function() {
        var queryVal = elm.value;
        apiService.get('?q=' + queryVal + '&rows=20').then(function(res) {
            reRender(JSON.parse(res.response));
        });
    };
    var reRender = function(items) {
        var ul = document.getElementById('results');
        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }
        var frag = document.createDocumentFragment();
        items.response.docs.forEach(function(i) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = i['records.link'][0];
            a.target = "_blank";
            a.textContent = i['records.text'][0].substring(0, 20); //.split(' ').slice(5).join();
            li.appendChild(a);
            frag.appendChild(li);
        });
        ul.appendChild(frag);
    };
};

(function() {
    var service = {};
    var apiURL = "http://localhost:8080/search";
    var endpoints = ['']
    var url = [];
    service.map = {};
    service.bodyObj = {};
    service.reset = function() {
        service.bodyObj = {};
        service.map = {};
    };
    // build us a querystring from an object
    service.queryStringBuilder = function(obj) {
        var retString = '?';
        var strings = [];
        _.each(obj, function(value, key) {
            strings.push(key + '=' + value);
        });
        retString += strings.join('&');
        console.log('querystringbuilder', retString);
        return retString;
    };
    // concatenates obj into proper url, adds querystring if present
    service.concatenator = function(map, query) {
        console.log('map', map, query);
        var concat = '';
        if (Object.keys(map)
            .length > 0) {
            _.each(map, function(val, key) {
                if (val) {
                    concat += '/' + key + '/' + val;
                } else {
                    concat += '/' + key;
                }
            });
        }
        if (query) {
            concat += query;
        }
        return concat;
    };
    // handles all http reqs
    service.genericHttp = function(method, data) {
        // clone vars to scope and reset so that we don't get collisions
        var local = {
            bodyObj: _.clone(service.bodyObj),
            map: _.clone(service.map)
        };
        // clear service for subsequent reqs
        service.reset();
        var deferred = new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            if (typeof data === 'string') {
                // has querystring
                xhr.open(method, apiURL + service.concatenator(local.map, data),
                    true);
            } else {
                xmlhttp.setRequestHeader("Content-Type",
                    "application/json;charset=UTF-8");
                xmlhttp.send(JSON.stringify(data));
                xhr.open(method, apiURL + service.concatenator(local.map, data),
                    true);
            }
            xhr.send(null);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    resolve({
                        status: xhr.status,
                        response: xhr.response
                    });
                } else if (xhr.readyState === 4 && (xhr.status === 500 || xhr
                        .status === 404)) {
                    console.log('http fail', xhr.response);
                    reject(xhr.status);
                }
            };
        });
        return deferred;
    };
    _.each(endpoints, function(endpoint) {
        service[endpoint] = function(inp) {
            // inp needs to be an int or a string,
            // advance datatypes will just make a broken url
            // there should be some validation eventually.
            if (inp) {
                service.map[endpoint] = inp;
            } else {
                service.map[endpoint] = false;
            }
            return service;
        };
    });
    service.post = function(passObj) {
        if (passObj) {
            service.bodyObj = passObj;
        }
        return service.genericHttp('POST');
    };
    service.get = function(querystring) {
        if (typeof querystring === 'string') {
            return service.genericHttp('GET', querystring);
        } else if (querystring) {
            return service.genericHttp('GET', service.queryStringBuilder(
                querystring));
        }
        return service.genericHttp('GET');
    };
    service.delete = function(passObj) {
        if (passObj) {
            service.bodyObj = passObj;
        }
        return service.genericHttp('DELETE');
    };
    service.put = function(passObj) {
        if (passObj) {
            service.bodyObj = passObj;
        }
        return service.genericHttp('PUT');
    };
    service.patch = function(passObj) {
        if (passObj) {
            service.bodyObj = passObj;
        }
        return service.genericHttp('PATCH');
    };
    window.apiService = service;
    return service;
})();
