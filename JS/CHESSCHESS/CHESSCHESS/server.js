var io = require('socket.io').listen(8080);
io.set('log level', 1);
var j=0;

io.sockets.on('connection', function (socket) {
console.log('%s: %s - connected', socket.id.toString(), socket.handshake.address.address);

j++;
var k=j;
if(j%2==0){
k--; 
}
socket.join('room'+k);
console.log('coonection in room',k);
socket.emit('id','room'+k);

if(io.sockets.clients('room'+k).length==2){
socket.broadcast.in('room'+k).emit('start','white');
socket.emit('start','black');
}
socket.on('step',function(x,y,x1,y1){
socket.broadcast.in('room'+k).emit('step',x,y,x1,y1);
console.log('step made ' + x + ' ' + y + ' ' + x1 + ' ' + y1);
})
socket.on('finish',function(){
socket.broadcast.in('room' + k).emit('finish');
})
socket.on('disconnect', function () {
socket.broadcast.in('room' + k).emit('disconnect');
if (j % 2 != 0) {
j -= 1;
}
console.log('%s: %s - disconnected', socket.id.toString(), socket.handshake.address.address);
});

});