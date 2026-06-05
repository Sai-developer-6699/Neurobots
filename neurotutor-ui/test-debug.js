// Test script to debug course materials and explanation issues
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Test course material API
async function testCourseMaterial() {
    console.log('Testing course material API...');
    try {
        const response = await axios.get(`${API_BASE_URL}/course/material/?concept=arrays`);
        console.log('✅ Course material API works:', response.status);
        console.log('Content length:', response.data.content?.length || 0);
    } catch (error) {
        console.error('❌ Course material API failed:', error.message);
        console.error('Response:', error.response?.data);
    }
}

// Test explanation API (requires auth)
async function testExplanation() {
    console.log('Testing explanation API...');
    try {
        // This will likely fail without authentication
        const response = await axios.get(`${API_BASE_URL}/question/explanation/?question_id=1`);
        console.log('✅ Explanation API works:', response.status);
    } catch (error) {
        console.error('❌ Explanation API failed:', error.message);
        console.error('Response:', error.response?.data);
        
        if (error.response?.status === 401) {
            console.log('🔐 Authentication required for explanation API');
        }
    }
}

// Test with authentication
async function testExplanationWithAuth() {
    console.log('Testing explanation API with auth...');
    try {
        // Get token from localStorage (if user is logged in)
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('❌ No auth token found in localStorage');
            return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/question/explanation/?question_id=1`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Explanation API with auth works:', response.status);
    } catch (error) {
        console.error('❌ Explanation API with auth failed:', error.message);
        console.error('Response:', error.response?.data);
    }
}

// Run all tests
async function runTests() {
    await testCourseMaterial();
    await testExplanation();
    await testExplanationWithAuth();
}

// Export for use in browser console
window.debugAPI = {
    testCourseMaterial,
    testExplanation,
    testExplanationWithAuth,
    runTests
};

console.log('🔧 Debug API functions loaded. Use window.debugAPI.runTests() to test.');
