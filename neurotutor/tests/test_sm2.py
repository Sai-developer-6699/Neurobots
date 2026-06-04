import unittest
import os
import django
from datetime import datetime, timedelta

# Setup Django environment for standalone test
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
django.setup()

from tutor.services.spaced_repetition_service import SpacedRepetitionService

class TestSM2Algorithm(unittest.TestCase):
    def setUp(self):
        self.service = SpacedRepetitionService()
    
    def test_perfect_recall(self):
        """Quality 5 should increase EF and Interval"""
        result = self.service.calculate_sm2(
            quality=5,
            repetition=2,
            ease_factor=2.5,
            last_interval=6
        )
        
        # EF should increase: 2.5 + (0.1 - (0) * ...) = 2.6
        self.assertAlmostEqual(result['ease_factor'], 2.6, places=1)
        self.assertEqual(result['repetition'], 3)
        # Interval: 6 * 2.6 = 15.6 -> 15
        self.assertEqual(result['interval'], 15)
    
    def test_failure_resets(self):
        """Quality < 3 should reset to repetition 0"""
        result = self.service.calculate_sm2(
            quality=2,
            repetition=5,
            ease_factor=2.5,
            last_interval=30
        )
        
        self.assertEqual(result['repetition'], 0)
        self.assertEqual(result['interval'], 1)
        # EF should decrease: 2.5 + (0.1 - (3)*(-0.02)...)
        # Actually: 5-2=3. 0.08 + 3*0.02 = 0.14. 3 * 0.14 = 0.42. 0.1 - 0.42 = -0.32.
        # 2.5 - 0.32 = 2.18
        self.assertLess(result['ease_factor'], 2.5)
    
    def test_minimum_ef(self):
        """EF should never go below 1.3"""
        result = self.service.calculate_sm2(
            quality=0,
            repetition=0,
            ease_factor=1.3,
            last_interval=1
        )
        
        self.assertGreaterEqual(result['ease_factor'], 1.3)

if __name__ == '__main__':
    unittest.main()
