from django.urls import path
from .views import FlowReportView, BalanceReportView

urlpatterns = [
    path('flow/', FlowReportView.as_view(), name='flow_report'),
    path('balance/', BalanceReportView.as_view(), name='balance_report'),
]
