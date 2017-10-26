// migration that creates a boolean feild for letting us know whether a member is on subscription or not
var db = connect(MONGO_URI); // MONGO_URI needs to be evaluated in command
// eg: mongo --eval "var MONGO_URI = 'localhost:27017/makerauthBackup'" addSubscriptionBool.js

function notIn(term, array){ // I'm sure there is a built in method for this... dgaf
    for(var i = 0; i < array.length; i++){
        if(term.valueOf() === array[i].valueOf()){return false;}
    }
    return true;
}

var date = new Date();
var pointMonth = date.getMonth();
var accountedForMembers = [];
var onSubscription = 0;

var memberCursor = db.members.find({status: 'activeMember'});
while(memberCursor.hasNext()){ // start off all active members as not on subscription
    var member = memberCursor.next();
    // db.members.update({fullname: member.fullname}, {$set: {subscription: false}});
}

for(var month = 0; month < 12; month++){   // check monthly ranges a year into past
    var lessThanMonth = date.getTime();    // timestamp of last month pointed at
    pointMonth--;                          // point to month before
    date.setMonth(pointMonth);             // set to month before
    var greaterThanMonth = date.getTime(); // timestamp of month before
    var cursor = db.payments.find({});     // get cursor for search of payment collection
    while(cursor.hasNext()){               // iterate through documents in payment collection
        var payment = cursor.next();       // grab a payment doc
        if(payment.member_id){             // given we have an member id already assosiated with this member (we need a better key to match on or a second one)
                                           // unfortunately it looks like if we had one we could auto-renew, normally these failed to match on name or email
            if(notIn(payment.member_id, accountedForMembers)){                          // for members we have yet to account for
                var dateOfPayment = new Date(payment.payment_date).getTime();           // convert payment time to universal unix timestamp
                if( dateOfPayment > greaterThanMonth && dateOfPayment < lessThanMonth){ // for this period (progressively searching into past from present)
                    // print(payment.firstname + ' ' + payment.lastname + ' : ' + payment.txn_type);
                    if(payment.txn_type === 'subscr_payment'){
                        // db.members.update({_id: payment.member_id}, {$set: {subscription: true}}); // probably want to run against a backup
                        onSubscription++;                                                             // testing against real thing in read only cant hurt
                    }
                    accountedForMembers.push(payment.member_id); // note we have accounted for this member
                }
            }
        } else {
            var match = db.members.findOne({fullname: payment.firstname + ' ' + payment.lastname});
            if(match){
                if(notIn(match._id, accountedForMembers)){
                    // print(match.fullname + ' is on ' + payment.txn_type);
                    accountedForMembers.push(match._id); // note we have accounted for this member
                    // db.members.update({_id: payment.member_id}, {$set: {subscription: true}}); // probably want to run against a backup
                    onSubscription++;                                                             // testing against real thing in read only cant hurt
                }
            } else {
                match = db.members.findOne({email: payment.payer_email}); // given match is still undefined
                if(match){
                    if(notIn(match._id, accountedForMembers)){
                        print(match.fullname + ' is on ' + payment.txn_type);
                        accountedForMembers.push(match._id); // note we have accounted for this member
                        // db.members.update({_id: payment.member_id}, {$set: {subscription: true}}); // probably want to run against a backup
                        onSubscription++;                                                             // testing against real thing in read only cant hurt
                    }
                }
            }
        }
    }
}
print(accountedForMembers.length + ' unique members accounted for');
print(onSubscription + ' members are on subscription');
