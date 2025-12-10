# auth_views
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm

# Authentication page view
def auth_page(request):
    """
    Main authentication page with choice screen
    Shows both forms but initially hidden
    """
    if request.user.is_authenticated:
        return redirect('home')
    
    # Initialize empty forms
    register_form = UserCreationForm()
    login_form = AuthenticationForm()
    
    context = {
        'register_form': register_form,
        'login_form': login_form,
    }
    
    return render(request, 'auth.html', context)

# Registration view
def register_view(request):
    """
    Handle registration form submission
    Returns to auth page with errors if validation fails
    """
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Auto-create conversation (handled by signal)
            login(request, user)
            return redirect('home')
        # If form is invalid, return to auth page with errors
        login_form = AuthenticationForm()  # Empty login form
        context = {
            'register_form': form,  # Form with errors
            'login_form': login_form,
            'show_form': 'register',  # Tell template to show register form
        }
        return render(request, 'auth/auth.html', context)
    
    # GET request should redirect to main auth page
    return redirect('auth_page')

# Login view
def login_view(request):
    """
    Handle login form submission
    Custom view to match our template structure
    """
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
        # If form is invalid
        register_form = UserCreationForm()  # Empty register form
        context = {
            'register_form': register_form,
            'login_form': form,  # Form with errors
            'show_form': 'login',  # Tell template to show login form
        }
        return render(request, 'auth/auth.html', context)
    
    # GET request should redirect to main auth page
    return redirect('auth_page')