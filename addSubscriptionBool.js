// migration that creates a boolean feild for letting us know whether a member is on subscription or not
var db = connect(process.env.MONGO_URI);

function notIn(term, array){
    for(var i = 0; i < array.length; i++){
        if(term === array[i]){return false;}
    }
    return true;
}

var date = new Date();
var pointMonth = date.getMonth();
var accountedForMembers = [];

for(var months = 0; month < 12; month++){  // check a year into past
    var lessThanMonth = date.getTime();    // time of current
    pointMonth--;                          // point to month before
    date.setMonth(pointMonth);             // set to month before
    var greaterThanMonth = date.getTime(); // time of month before
    var cursor = db.payments.find({});     // get cursor for search of payment collection
    while(cursor.hasNext()){
        var payment = cursor.next();
        if(payment.member_id){
            if(notIn(payment.member_id.$oid, accountedForMembers)){ // for members we have yet to account for
                var member = db.members.findOne({_id: payment.member_id.$oid});
                if(member.expiration <= new Date.getTime()){        // given this is a member in good standing
                    var dateOfPayment = new Date(payment.payment_date).getTime();
                    if( dateOfPayment > greaterThanMonth && dateOfPayment < lessThanMonth){ // for this period
                        if(payment.txn_type === 'subscr_payment'){
                            db.members.update({_id: payment.member_id.$oid}, {$set: {subscription: true}});
                        } else {
                            db.members.update({_id: payment.member_id.$oid}, {$set: {subscription: false}});
                        }
                    }
                } else { // expired member
                    db.members.update({_id: payment.member_id.$oid}, {$set: {subscription: false}}); // subscription means active subscription
                }
                accountedForMembers.push(payment.member_id.$oid); // note we have accounted for this member
            }
        }
    }
}
print(accountedForMembers.length + ' members updated');
