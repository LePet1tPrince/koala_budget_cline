from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import UserViewSet, SubAccountTypeViewSet, AccountViewSet, TransactionViewSet, AccountBalanceView, SavingViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('subaccounttypes', SubAccountTypeViewSet)
router.register('accounts', AccountViewSet, basename='account')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('savings', SavingViewSet, basename='saving')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('balances/', AccountBalanceView.as_view(), name='account_balances'),
]
