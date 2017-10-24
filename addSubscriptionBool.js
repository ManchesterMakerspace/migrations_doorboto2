// migration that creates a boolean feild for letting us know whether a member is on subscription or not
var db = connect(process.env.MONGO_URI);

var cursor = db.payments.find({});
var aMonthAgo = new Date().getTime() - 21037968000; // subtract thirty one days in millis
var membersUpdated = 0;
while(cursor.hasNext()){
    var payment = cursor.next();
    if(new Date(payment.payment_date).getTime() > aMonthAgo){
        if(payment.member_id){
            if(payment.txn_type === 'subscr_payment'){
                db.members.update({_id: payment.member_id.$oid}, {$set: {subscription: true}});
            } else {
                db.members.update({_id: payment.member_id.$oid}, {$set: {subscription: false}});
            }
            membersUpdated++;
        }
    } // skip every traction more than a month old ...
}
print(membersUpdated + ' members updated');
