(function(window) {

  function getSocket(socket){
    return function(){
      return socket;
    };
  }

  function formatNumberInput(input) {
    return parseInt(input, 10);
  }

  function renderJson($el, json) {
    $el.html(`<pre>${stringify(json)}</pre>`);
  }

  function stringify(o) {
    var str =
      $.map(o, function (val, key) {
        var formatted = typeof val === 'string' ? `"${val}"` : val;
        return `  ${key}: ${formatted}`;
      });
    return `{\n${str.join(',\n')}\n}`;
  }

  function returnFirstMessage(messageTypes, messages) {
    if(!messages.length) {
      return;
    }
    return matchMessageType(messages[0].type, messageTypes) && messages[0];
  }

  function matchMessageType(messageType, messageTypes){
    return messageTypes.findIndex(function(type){ return messageType === type; }) !== -1;
  }


  window.FUTU2 = {
    getSocket: getSocket(io.connect(window.location.protocol + '//' + window.location.host)),
    utils: {
      returnFirstMessage: returnFirstMessage,
      formatNumberInput: formatNumberInput,
      matchMessageType: matchMessageType,
      renderJson: renderJson
    }
  };
})(window);
