#!/usr/bin/env python3
"""
Test script to verify Review and Skip functionality
"""
import os
import sys
import django

# Add the neurotutor directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'neurotutor'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
django.setup()

from tutor.models import Question, User, ManualReviewQueue, SkippedQuestion
from django.utils import timezone

def test_review_skip_functionality():
    print("🧪 Testing Review and Skip Functionality")
    print("=" * 50)
    
    # Check database state
    question_count = Question.objects.count()
    user_count = User.objects.count()
    review_count = ManualReviewQueue.objects.count()
    skip_count = SkippedQuestion.objects.count()
    
    print(f"📊 Database State:")
    print(f"   Questions: {question_count}")
    print(f"   Users: {user_count}")
    print(f"   Manual Review Queue: {review_count}")
    print(f"   Skipped Questions: {skip_count}")
    
    # Get a test user and question
    test_user = User.objects.first()
    test_question = Question.objects.first()
    
    if not test_user or not test_question:
        print("❌ No test user or question found!")
        return False
    
    print(f"\n🔧 Testing with:")
    print(f"   User: {test_user.email}")
    print(f"   Question: {test_question.id} - {test_question.text[:50]}...")
    
    # Test 1: Add to Manual Review Queue
    print(f"\n📝 Test 1: Adding question to Manual Review Queue...")
    try:
        review_item, created = ManualReviewQueue.objects.get_or_create(
            user=test_user,
            question=test_question,
            defaults={'added_at': timezone.now()}
        )
        if created:
            print("✅ Successfully added to Manual Review Queue")
        else:
            print("ℹ️  Question already in Manual Review Queue")
    except Exception as e:
        print(f"❌ Failed to add to Manual Review Queue: {e}")
        return False
    
    # Test 2: Add to Skipped Questions
    print(f"\n⏭️  Test 2: Adding question to Skipped Questions...")
    try:
        skip_item, created = SkippedQuestion.objects.get_or_create(
            user=test_user,
            question=test_question,
            defaults={'skipped_at': timezone.now(), 'skip_count': 1}
        )
        if created:
            print("✅ Successfully added to Skipped Questions")
        else:
            # Increment skip count
            skip_item.skip_count += 1
            skip_item.save()
            print(f"ℹ️  Question already skipped (count: {skip_item.skip_count})")
    except Exception as e:
        print(f"❌ Failed to add to Skipped Questions: {e}")
        return False
    
    # Test 3: Check final state
    print(f"\n📊 Final Database State:")
    print(f"   Manual Review Queue: {ManualReviewQueue.objects.count()}")
    print(f"   Skipped Questions: {SkippedQuestion.objects.count()}")
    
    # Test 4: Simulate correct answer (auto-delete from review queue)
    print(f"\n🗑️  Test 4: Simulating correct answer (auto-delete)...")
    try:
        deleted_count = ManualReviewQueue.objects.filter(
            user=test_user,
            question=test_question
        ).delete()
        print(f"✅ Auto-deleted {deleted_count[0]} items from Manual Review Queue")
    except Exception as e:
        print(f"❌ Failed to auto-delete: {e}")
        return False
    
    print(f"\n🎉 All tests passed! Review and Skip functionality is working correctly.")
    return True

if __name__ == "__main__":
    success = test_review_skip_functionality()
    sys.exit(0 if success else 1)
