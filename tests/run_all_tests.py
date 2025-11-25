import os
import sys

def run_all_tests():
    """Run all test files"""
    print(" RUNNING ALL TESTS")
    print("=" * 50)
    
    tests = [
        ('OpenRouter API', 'test_openrouter'),
        ('Database Models', 'test_database'),
        ('Services', 'test_services')
    ]
    
    results = []
    
    for test_name, test_file in tests:
        print(f"\nRunning {test_name} Test...")
        try:
            # Import and run the test
            module = __import__(test_file)
            success = module.test_connection() if test_file == 'test_openrouter' else module.test_database_models() if test_file == 'test_database' else module.test_services()
            results.append((test_name, success))
            print(f"{test_name}: {'PASS' if success else 'FAIL'}")
        except Exception as e:
            print(f"{test_name} failed to run: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("TEST RESULTS:")
    for test_name, success in results:
        status = "PASS" if success else "FAIL"
        print(f"  {test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    print(f"\nOVERALL: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()