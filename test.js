window.multiplyByTen = function() {
  const input = document.getElementById('numInput').value;
  const result = input * 10;
  document.getElementById('output').innerText = result;
};
