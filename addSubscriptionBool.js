// migration that creates a boolean feild for letting us know whether a member is on subscription or not
var db = connect(MONGO_URI); // MONGO_URI needs to be evaluated in command
// eg: mongo --eval "var MONGO_URI = 'localhost:27017/makerauthBackup'" addSubscriptionBool.js

function notIn(term, array){
    for(var i = 0; i < array.length; i++){
        if(term.valueOf() === array[i].valueOf()){return false;}
    }
    return true;
}

var date = new Date();
var pointMonth = date.getMonth();
var accountedForMembers = [];
var onSubscription = 0;

for(var month = 0; month < 12; month++){  // check a year into past
    var lessThanMonth = date.getTime();    // time of current
    pointMonth--;                          // point to month before
    date.setMonth(pointMonth);             // set to month before
    var greaterThanMonth = date.getTime(); // time of month before
    var cursor = db.payments.find({});     // get cursor for search of payment collection
    while(cursor.hasNext()){
        var payment = cursor.next();
        if(payment.member_id){
            if(notIn(payment.member_id, accountedForMembers)){ // for members we have yet to account for
                var dateOfPayment = new Date(payment.payment_date).getTime();
                if( dateOfPayment > greaterThanMonth && dateOfPayment < lessThanMonth){ // for this period
                    print(payment.firstname + ' ' + payment.lastname + ' : ' + payment.txn_type);
                    if(payment.txn_type === 'subscr_payment'){
                        // db.members.update({_id: payment.member_id}, {$set: {subscription: true}});
                        onSubscription++;
                    } else {
                        // db.members.update({_id: payment.member_id}, {$set: {subscription: false}});
                    }
                    accountedForMembers.push(payment.member_id); // note we have accounted for this member
                }
            }
        }
    }
}
print(accountedForMembers.length + ' unique member payments have ids assosiated');
print(onSubscription + ' members are on subscription');
