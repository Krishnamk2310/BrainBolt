
import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:3001/v1';

function log(msg: string) {
  console.log(msg);
  fs.appendFileSync('verification.log', msg + '\n');
}

async function runVerification() {
  fs.writeFileSync('verification.log', ''); // Clear log
  try {
    log('1. Registering/Logging in user...');
    // Create a random user to ensure fresh state
    const username = `verify_${Math.floor(Math.random() * 10000)}`;
    const loginRes = await axios.post(`${API_URL}/auth/login`, { username });
    const { token, user } = loginRes.data.data;
    const userId = user.id;
    log(`   User logged in: ${username} ${userId}`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-user-id': userId
    };

    log('2. Fetching next question...');
    const nextRes = await axios.get(`${API_URL}/quiz/next`, { headers });
    const { question, userState, stateVersion } = nextRes.data.data;
    
    log(`   Question ID: ${question.id}`);
    log(`   User State Current Question ID: ${userState.currentQuestionId}`);
    log(`   State Version: ${stateVersion}`);

    if (userState.currentQuestionId !== question.id) {
       log('   WARNING: Returned userState.currentQuestionId does not match question.id!');
    } else {
       log('   Confirmed: userState.currentQuestionId matches question.id');
    }

    log('2.5. Checking server state before answering...');
    const stateRes = await axios.get(`${API_URL}/quiz/state`, { headers });
    const serverState = stateRes.data.data;
    log(`   Server State Check: currentQuestionId=${serverState.currentQuestionId}`);

    if (serverState.currentQuestionId !== question.id) {
        log('   ❌ CRITICAL: Server state does NOT match question ID even after /next call!');
    } else {
        log('   ✅ Server state matches question ID.');
    }

    log('3. Submitting answer...');
    const answerPayload = {
        questionId: question.id,
        selectedIndex: question.correctIndex, // Simulate correct answer
        stateVersion: stateVersion,
        answerIdempotencyKey: `verify_key_${Date.now()}`
    };

    const answerRes = await axios.post(`${API_URL}/quiz/answer`, answerPayload, { headers });
    
    if (answerRes.data.success) {
        log('   ✅ Correct Answer submitted successfully!');
        let result = answerRes.data.data.result;
        log(`   Result: ${JSON.stringify(result)}`);
        
        // 4. Submit a WRONG answer
        log('4. Fetching next question for WRONG answer test...');
        const nextRes2 = await axios.get(`${API_URL}/quiz/next`, { headers });
        const q2 = nextRes2.data.data.question;
        const state2 = nextRes2.data.data.userState;
        const v2 = nextRes2.data.data.stateVersion;

        log(`   Question 2 ID: ${q2.id}`);
        
        // Find a WRONG index
        const wrongIndex = (q2.correctIndex + 1) % q2.options.length;
        
        log(`   Submitting WRONG answer (Index ${wrongIndex} vs Correct ${q2.correctIndex})...`);
        const wrongPayload = {
            questionId: q2.id,
            selectedIndex: wrongIndex,
            stateVersion: v2,
            answerIdempotencyKey: `verify_key_${Date.now()}_wrong`
        };
        
        const wrongRes = await axios.post(`${API_URL}/quiz/answer`, wrongPayload, { headers });
        
        if (wrongRes.data.success) {
             result = wrongRes.data.data.result;
             log('   ✅ Wrong answer processed.');
             log(`   Score Delta: ${result.scoreDelta}`);
             log(`   New Score: ${result.newScore}`);
             
             if (result.scoreDelta < 0) {
                 log('   ✅ Penalty applied correctly (delta < 0)');
             } else {
                 log('   ❌ Penalty NOT applied (delta >= 0)');
             }
        }
        
    } else {
        log(`   ❌ Answer submission failed: ${JSON.stringify(answerRes.data)}`);
    }

  } catch (error: any) {
    log(`❌ Verification failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
  }
}

runVerification();
